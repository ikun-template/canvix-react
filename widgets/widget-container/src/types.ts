/*
 * Description: Container widget custom data type.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

export interface ContainerData {
  /** Flex direction of the container layout. */
  direction: 'row' | 'column';
  /** Gap between children (px). */
  gap: number;
}
