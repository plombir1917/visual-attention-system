import cv2
import mediapipe as mp
import numpy as np
import torch

from .geometry_attention import compute_attention
from .headpose import estimate_head_pose, estimate_distance
from .model import GazeCNN


class AttentionPipeline:
    def __init__(self, model_path: str, device: str = "cpu"):
        self.device = torch.device(device)

        # Gaze regression model
        self.gaze_model = GazeCNN().to(self.device)
        self.gaze_model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.gaze_model.eval()

        # MediaPipe FaceMesh
        mp_face = mp.solutions.face_mesh
        self.face_mesh = mp_face.FaceMesh(refine_landmarks=True)

        # EMA smoothing state
        self.prev_gaze = None
        self.EMA_ALPHA = 0.6

    def _empty_result(self):
        return {
            "attention": False,
            "theta": None,
            "alpha": None,
            "distance": None,
            "gaze_vector": None,
        }

    def _preprocess_eye(self, frame, landmarks, eye_indices):
        h, w, _ = frame.shape
        points = [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in eye_indices]

        x_coords = [p[0] for p in points]
        y_coords = [p[1] for p in points]

        x_min = max(min(x_coords) - 5, 0)
        x_max = min(max(x_coords) + 5, w)
        y_min = max(min(y_coords) - 5, 0)
        y_max = min(max(y_coords) + 5, h)

        if x_max <= x_min or y_max <= y_min:
            return None

        eye_crop = frame[y_min:y_max, x_min:x_max]

        if eye_crop.size == 0:
            return None

        eye_crop = cv2.cvtColor(eye_crop, cv2.COLOR_BGR2GRAY)
        eye_crop = cv2.resize(eye_crop, (55, 35))

        eye_crop = eye_crop.astype(np.float32) / 255.0
        eye_crop = np.expand_dims(eye_crop, axis=(0, 1))

        return torch.from_numpy(eye_crop).to(self.device)

    def process_frame(self, frame):
        """
        frame: BGR numpy array (OpenCV)

        Returns:
            dict with keys:
                - attention: bool
                - theta: float | None
                - alpha: float | None
                - distance: float | None
                - gaze_vector: np.ndarray | None
        """
        if frame is None:
            return self._empty_result()

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return self._empty_result()

        landmarks = results.multi_face_landmarks[0].landmark

        left_eye_idx = [33, 133, 160, 159, 158, 157, 173]
        right_eye_idx = [263, 362, 387, 386, 385, 384, 398]

        left_eye = self._preprocess_eye(frame, landmarks, left_eye_idx)
        right_eye = self._preprocess_eye(frame, landmarks, right_eye_idx)

        if left_eye is None or right_eye is None:
            return self._empty_result()

        # 1) CNN: направление взгляда
        with torch.no_grad():
            gaze_left = self.gaze_model(left_eye)
            gaze_right = self.gaze_model(right_eye)

            gaze_left = torch.nn.functional.normalize(gaze_left, dim=1)
            gaze_right = torch.nn.functional.normalize(gaze_right, dim=1)

            gaze_left = gaze_left.cpu().numpy()[0]
            gaze_right = gaze_right.cpu().numpy()[0]

        # Right eye is mirrored horizontally
        gaze_right[0] *= -1

        # average both eyes
        gaze_eye = (gaze_left + gaze_right) / 2.0

        norm = np.linalg.norm(gaze_eye)
        if norm <= 1e-6:
            return self._empty_result()

        gaze_eye = gaze_eye / norm

        # Alignment UnityEyes → webcam
        gaze_eye[0] *= -1

        # Smoothing (EMA)
        if self.prev_gaze is None:
            self.prev_gaze = gaze_eye
        else:
            gaze_eye = self.EMA_ALPHA * gaze_eye + (1 - self.EMA_ALPHA) * self.prev_gaze
            gaze_eye = gaze_eye / np.linalg.norm(gaze_eye)
            self.prev_gaze = gaze_eye

        # 2) Геометрия: голова + дистанция
        R_head = estimate_head_pose(landmarks, frame.shape)
        distance = estimate_distance(landmarks, frame.shape[1])

        attention_bool = False
        theta = None
        alpha = None

        if R_head is not None:
            geo_attention, theta, alpha = compute_attention(
                gaze_eye,
                R_head,
                distance,
            )
            if geo_attention is not None:
                attention_bool = bool(geo_attention == 1)

        return {
            "attention": attention_bool,
            "theta": theta,
            "alpha": alpha,
            "distance": float(distance) if distance is not None else None,
            "gaze_vector": gaze_eye,
        }

