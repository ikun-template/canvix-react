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

  getSnapshot(): EditorStateSnapshot {
    return {
      activePageId: this._activePageId,
      selectedWidgetIds: [...this._selectedWidgetIds],
      zoom: this._zoom,
      scroll: { ...this._scroll },
    };
  }

  onChange(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }
}
