package modelgrpc

import (
	"context"
	"encoding/json"
	"fmt"

	"attention-service/internal/config"
	"attention-service/internal/port"
	attentionv1 "attention-service/proto/attention/v1"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// Factory holds a shared gRPC connection and creates a new bidirectional stream
// for each client session.
type Factory struct {
	stub attentionv1.AttentionModelClient
	conn *grpc.ClientConn
}

func NewFactory(cfg config.Model) (*Factory, error) {
	conn, err := grpc.NewClient(
		cfg.GRPCAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("grpc dial %s: %w", cfg.GRPCAddr, err)
	}
	return &Factory{
		conn: conn,
		stub: attentionv1.NewAttentionModelClient(conn),
	}, nil
}

// Close shuts down the shared gRPC connection.
func (f *Factory) Close() error {
	return f.conn.Close()
}

// New opens a new bidirectional stream for one client session.
func (f *Factory) New(ctx context.Context) (port.ModelClient, error) {
	stream, err := f.stub.ProcessFrames(ctx)
	if err != nil {
		return nil, fmt.Errorf("open grpc stream: %w", err)
	}
	return &streamClient{stream: stream}, nil
}

// streamClient wraps a single ProcessFrames stream. Each ProcessFrame call
// sends one frame and receives one result — matching the prior WS behavior.
type streamClient struct {
	stream attentionv1.AttentionModel_ProcessFramesClient
}

func (c *streamClient) ProcessFrame(ctx context.Context, frame []byte) ([]byte, error) {
	if err := c.stream.Send(&attentionv1.FrameRequest{Data: frame}); err != nil {
		return nil, fmt.Errorf("grpc send frame: %w", err)
	}
	resp, err := c.stream.Recv()
	if err != nil {
		return nil, fmt.Errorf("grpc recv result: %w", err)
	}
	// Use a custom struct without omitempty so focus=false is always included in JSON.
	// The proto-generated struct has json:"focus,omitempty" which silently drops false values.
	out, err := json.Marshal(struct {
		Focus      bool      `json:"focus"`
		Theta      float64   `json:"theta"`
		Alpha      float64   `json:"alpha"`
		Distance   float64   `json:"distance"`
		GazeVector []float64 `json:"gaze_vector"`
	}{
		Focus:      resp.Focus,
		Theta:      resp.Theta,
		Alpha:      resp.Alpha,
		Distance:   resp.Distance,
		GazeVector: resp.GazeVector,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal grpc response: %w", err)
	}
	return out, nil
}

func (c *streamClient) Close() error {
	return c.stream.CloseSend()
}
