type StateListener = () => void;

export interface EditorStateSnapshot {
  activePageId: string;
  selectedWidgetIds: string[];
  zoom: number;
  scroll: { x: number; y: number };
}

export class EditorState {
  private _activePageId = '';
  private _selectedWidgetIds: string[] = [];
  private _zoom = 1;
  private _scroll = { x: 0, y: 0 };
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

  /** Returns a cached snapshot; same reference until state changes. */
  getSnapshot = (): EditorStateSnapshot => {
    if (!this._snapshot) {
      this._snapshot = {
        activePageId: this._activePageId,
        selectedWidgetIds: this._selectedWidgetIds,
        zoom: this._zoom,
        scroll: this._scroll,
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
