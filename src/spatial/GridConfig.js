/**
 * Warehouse floor grid configuration (southwest-corner origin policy).
 * @module spatial/GridConfig
 */

import { DEFAULT_SPATIAL_CELL_SIZE } from '../domain/types.js';

export class GridConfig {
  /**
   * @param {import('../domain/types.js').GridConfig} props
   */
  constructor(props) {
    this.cellSize = props.cellSize;
    this.originX = props.originX;
    this.originZ = props.originZ;
    this.cols = props.cols;
    this.rows = props.rows;
    this.widthM = props.widthM;
    this.depthM = props.depthM;
  }

  /**
   * Build grid from warehouse shell dims (center-origin footprint).
   *
   * @param {{ width?: number, depth?: number }} warehouse
   * @param {number} [cellSize]
   * @returns {GridConfig}
   */
  static fromWarehouse(warehouse = {}, cellSize = DEFAULT_SPATIAL_CELL_SIZE) {
    const widthM = warehouse.width ?? 44;
    const depthM = warehouse.depth ?? 30;
    const size = cellSize > 0 ? cellSize : DEFAULT_SPATIAL_CELL_SIZE;
    const originX = -widthM / 2;
    const originZ = -depthM / 2;
    const cols = Math.max(1, Math.ceil(widthM / size));
    const rows = Math.max(1, Math.ceil(depthM / size));

    return new GridConfig({
      cellSize: size,
      originX,
      originZ,
      cols,
      rows,
      widthM,
      depthM
    });
  }

  /** Plain object suitable for WarehouseDocument.grid */
  toJSON() {
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
