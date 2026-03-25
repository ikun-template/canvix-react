type StateListener = () => void;

export type ToolType = 'select' | 'hand';

export interface EditorStateSnapshot {
  activePageId: string;
  selectedWidgetIds: string[];
  hoveredWidgetId: string | null;
  zoom: number;
  camera: { x: number; y: number };
  activeTool: ToolType;
  interacting: boolean;
  flowDragWidgetId: string | null;
  flowDropIndex: number | null;
  flowDragWidgetSize: [number, number] | null;
}

export interface EditorStateStoreOptions {
  initialPageId?: string;
}

export class EditorStateStore {
  private _activePageId = '';
  private _selectedWidgetIds: string[] = [];
  private _zoom = 1;
  private _camera = { x: 0, y: 0 };
  private _activeTool: ToolType = 'select';
  private _interacting = false;
  private _hoveredWidgetId: string | null = null;
  private _flowDragWidgetId: string | null = null;
  private _flowDropIndex: number | null = null;
  private _flowDragWidgetSize: [number, number] | null = null;
  private _snapshot: EditorStateSnapshot | null = null;
  private listeners = new Set<StateListener>();
  private _batching = false;
  private _batchDirty = false;

  constructor(options?: EditorStateStoreOptions) {
    if (options?.initialPageId) {
      this._activePageId = options.initialPageId;
    }
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

  setCamera(x: number, y: number) {
    this._camera = { x, y };
    this.notify();
  }

  setActiveTool(tool: ToolType) {
    this._activeTool = tool;
    this.notify();
  }

  setInteracting(value: boolean) {
    if (this._interacting === value) return;
    this._interacting = value;
    this.notify();
  }

  setHoveredWidget(id: string | null) {
    if (this._hoveredWidgetId === id) return;
    this._hoveredWidgetId = id;
    this.notify();
  }

  setFlowDrag(widgetId: string | null, size?: [number, number]) {
    this._flowDragWidgetId = widgetId;
    this._flowDragWidgetSize = size ?? null;
    this._flowDropIndex = null;
    this.notify();
  }

  setFlowDropIndex(index: number | null) {
    this._flowDropIndex = index;
    this.notify();
  }

  /** Returns a cached snapshot; same reference until state changes. */
  getSnapshot = (): EditorStateSnapshot => {
    if (!this._snapshot) {
      this._snapshot = {
        activePageId: this._activePageId,
        selectedWidgetIds: this._selectedWidgetIds,
        hoveredWidgetId: this._hoveredWidgetId,
        zoom: this._zoom,
        camera: this._camera,
        activeTool: this._activeTool,
        interacting: this._interacting,
        flowDragWidgetId: this._flowDragWidgetId,
        flowDropIndex: this._flowDropIndex,
        flowDragWidgetSize: this._flowDragWidgetSize,
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

  /** Batch multiple mutations into a single notification. */
  batch(fn: () => void) {
    this._batching = true;
    this._batchDirty = false;
    fn();
    this._batching = false;
    if (this._batchDirty) {
      this._batchDirty = false;
      this._snapshot = null;
      for (const listener of this.listeners) listener();
    }
  }

  private notify() {
    if (this._batching) {
      this._batchDirty = true;
      this._snapshot = null;
      return;
    }
    this._snapshot = null;
    for (const fn of this.listeners) fn();
  }
}
