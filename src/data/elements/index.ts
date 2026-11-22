import { frames } from './frames';
import { others } from './others';
import { slabs } from './slabs';
import type { ElementCategory, ElementType } from './types';

export * from './types';

/**
 * The element library: every structural element type the site can draw, check and measure.
 * The model reader tags each imported member with one of these ids (StructuralElement.typeId).
 */
export const elementTypes: ElementType[] = [...slabs, ...frames, ...others];

export const elementType = (id: string | undefined) => elementTypes.find((e) => e.id === id);

export const CATEGORY_ORDER: ElementCategory[] = ['slab', 'beam', 'vertical', 'stair-ramp', 'foundation'];
