import type { AnyProject } from '../../store/projectsStore';
import type { BuildingSpec } from '../../lib/structure/types';
import { buildings as builtIn } from '../../data/buildings';
import { IsoDrawing } from './IsoDrawing';
import { cn } from '../../utils/cn';

/** Best picture of a project: your photo, then a 3D snapshot, then the rendered model. */
function projectImageSrc(p: AnyProject, spec?: BuildingSpec): string | undefined {
  if (p.cover) return p.cover;
  if (p.render) return p.render;
  if (spec && builtIn.some((b) => b.id === spec.id)) return `/renders/${spec.id}.jpg`;
  return undefined;
}

export function ProjectImage({
  project,
  spec,
  className,
  imgClassName,
}: {
  project: AnyProject;
  spec?: BuildingSpec;
  className?: string;
  imgClassName?: string;
}) {
  const src = projectImageSrc(project, spec);
  if (src) {
    return (
      <img
        src={src}
        alt={project.cover ? project.title : `3D model of ${project.shortTitle}`}
        loading="lazy"
        decoding="async"
        className={cn('h-full w-full object-cover', imgClassName)}
      />
    );
  }
  if (spec) {
    return (
      <div className={cn('h-full w-full p-8 text-bone/70', className)}>
        <IsoDrawing spec={spec} animate={false} />
      </div>
    );
  }
  return null;
}
