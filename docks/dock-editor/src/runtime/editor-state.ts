type StateListener = () => void;

export type ToolType = 'select' | 'hand';

export interface EditorStateSnapshot {
  activePageId: string;
  selectedWidgetIds: string[];
  zoom: number;
  scroll: { x: number; y: number };
  activeTool: ToolType;
  interacting: boolean;
}

export class EditorState {
  private _activePageId = '';
  private _selectedWidgetIds: string[] = [];
  private _zoom = 1;
  private _scroll = { x: 0, y: 0 };
  private _activeTool: ToolType = 'select';
  private _interacting = false;
  private _snapshot: EditorStateSnapshot | null = null;
  private listeners = new Set<StateListener>();

  get activePageId() {
    return this._activePageId;
  }

  get selectedWidgetIds() {
    return this._selectedWidgetIds;
  }

  get zoom() {
    return this._zoom;
  }

  get scroll() {
    return this._scroll;
  }

  get activeTool() {
    return this._activeTool;
  }

  get interacting() {
    return this._interacting;
  }

  setActivePage(pageId: string) {
    this._activePageId = pageId;
    this._selectedWidgetIds = [];
    this.notify();
  }

  setSelection(widgetIds: string[]) {
    this._selectedWidgetIds = widgetIds;
    this.notify();
  }

  setZoom(zoom: number) {
    this._zoom = zoom;
    this.notify();
  }

  setScroll(x: number, y: number) {
    this._scroll = { x, y };
    this.notify();
  }

  setActiveTool(tool: ToolType) {
    this._activeTool = tool;
    this.notify();
  }

  setInteracting(value: boolean) {
    this._interacting = value;
    this.notify();
  }

  /** Returns a cached snapshot; same reference until state changes. */
  getSnapshot = (): EditorStateSnapshot => {
    if (!this._snapshot) {
      this._snapshot = {
        activePageId: this._activePageId,
        selectedWidgetIds: this._selectedWidgetIds,
        zoom: this._zoom,
        scroll: this._scroll,
        activeTool: this._activeTool,
        interacting: this._interacting,
      };
    }
    return this._snapshot;
  };

  /** Subscribe to state changes. Returns unsubscribe function. */
  onChange = (listener: StateListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this._snapshot = null;
    for (const fn of this.listeners) fn();
  }
}
