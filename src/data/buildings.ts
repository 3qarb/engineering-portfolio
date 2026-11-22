import type { BuildingSpec } from '../lib/structure/types';
import { villa } from './models/villa';

/**
 * The structures shown in the 3D explorer. Each one links to a project by slug.
 * The villa is an imported project model (basis 'project'). Models added from the Add-project page join it.
 */
export const buildings: BuildingSpec[] = [
  villa,
];
