import cv2

from core.attention_pipeline import AttentionPipeline


def main():
    cap = cv2.VideoCapture(0)

    pipeline = AttentionPipeline("checkpoints/best_model.pt")

    def draw_ui(frame, result):
        attention = result["attention"]
        theta = result["theta"]
        alpha = result["alpha"]

        status = "ATTENTIVE" if attention else "NOT ATTENTIVE"

        cv2.putText(
            frame,
            f"{status}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0) if attention else (0, 0, 255),
            2,
        )

        if theta is not None and alpha is not None:
            cv2.putText(
                frame,
                f"angle: {theta:.1f} / limit: {alpha:.1f}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
            )

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        result = pipeline.process_frame(frame)
        draw_ui(frame, result)
        cv2.imshow("Attention Monitor", frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()

