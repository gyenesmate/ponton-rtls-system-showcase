import { DEFAULT_SPATIAL_CELL_SIZE, type GridConfigData } from './types.ts';

export class GridConfig implements GridConfigData {
  cellSize: number;
  originX: number;
  originZ: number;
  cols: number;
  rows: number;
  widthM: number;
  depthM: number;

  constructor(props: GridConfigData) {
    this.cellSize = props.cellSize;
    this.originX = props.originX;
    this.originZ = props.originZ;
    this.cols = props.cols;
    this.rows = props.rows;
    this.widthM = props.widthM;
    this.depthM = props.depthM;
  }

  static fromWarehouse(
    warehouse: { width?: number; depth?: number } = {},
    cellSize = DEFAULT_SPATIAL_CELL_SIZE
  ): GridConfig {
    const widthM = warehouse.width ?? 44;
    const depthM = warehouse.depth ?? 30;
    const size = cellSize > 0 ? cellSize : DEFAULT_SPATIAL_CELL_SIZE;

    return new GridConfig({
      cellSize: size,
      originX: -widthM / 2,
      originZ: -depthM / 2,
      cols: Math.max(1, Math.ceil(widthM / size)),
      rows: Math.max(1, Math.ceil(depthM / size)),
      widthM,
      depthM
    });
  }

  toJSON(): GridConfigData {
    return {
      cellSize: this.cellSize,
      originX: this.originX,
      originZ: this.originZ,
      cols: this.cols,
      rows: this.rows,
      widthM: this.widthM,
      depthM: this.depthM
    };
  }
}
