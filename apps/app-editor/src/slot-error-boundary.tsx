import type { Chronicle } from '@canvix-react/chronicle';
import { useEditorRef } from '@canvix-react/toolkit-editor';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface SlotErrorBoundaryProps {
  slotName: string;
  chronicle: Chronicle;
  children: ReactNode;
}

interface InnerProps extends SlotErrorBoundaryProps {
  onEditorChange: (listener: () => void) => () => void;
}

interface State {
  error: Error | null;
}

const MAX_RETRIES = 3;
const RETRY_WINDOW_MS = 3000;

class SlotErrorBoundaryInner extends Component<InnerProps, State> {
  state: State = { error: null };
  private unsubscribers: (() => void)[] = [];
  private recentErrors: number[] = [];

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[slot:${this.props.slotName}]`, error, info.componentStack);
    this.recentErrors.push(Date.now());
  }

  componentDidMount() {
    this.subscribe();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  private subscribe() {
    const tryRecover = () => {
      if (!this.state.error) return;

      // Prevent rapid error loops: if errored MAX_RETRIES times within the window, stop
      const now = Date.now();
      this.recentErrors = this.recentErrors.filter(
        t => now - t < RETRY_WINDOW_MS,
      );
      if (this.recentErrors.length >= MAX_RETRIES) return;

      this.setState({ error: null });
    };

    this.unsubscribers.push(
      this.props.onEditorChange(tryRecover),
      this.props.chronicle.onUpdate(() => tryRecover()),
    );
  }

  private unsubscribe() {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 12,
            color: '#b91c1c',
            fontSize: 12,
            overflow: 'auto',
            height: '100%',
          }}
        >
          <strong>{this.props.slotName}</strong>
          <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function SlotErrorBoundary(props: SlotErrorBoundaryProps) {
  const ref = useEditorRef();
  return <SlotErrorBoundaryInner {...props} onEditorChange={ref.onChange} />;
}
