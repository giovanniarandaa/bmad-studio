/**
 * ProjectList
 *
 * Container component that renders a list of projects.
 * Shows empty state with CTA when no projects exist.
 */

import React from 'react';
import { Plus } from 'lucide-react';
import type { Project } from '../../../../shared/types/database';
import { ProjectListItem } from './ProjectListItem';
import { Button } from '../Button';
import './ProjectList.css';

interface ProjectListProps {
  projects: Project[];
  projectPathsStatus: Map<number, boolean>;
  onProjectRemove: (id: number) => void;
  onProjectSelect?: (project: Project) => void;
  onAddProject: () => void;
}

export function ProjectList({
  projects,
  projectPathsStatus,
  onProjectRemove,
  onProjectSelect,
  onAddProject,
}: ProjectListProps) {
  // Empty state
  if (projects.length === 0) {
    return (
      <div className="project-list-empty">
        <p className="empty-message">No hay proyectos aún</p>
        <Button
          label="Agregar Proyecto"
          onClick={onAddProject}
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
        />
      </div>
    );
  }

  // Projects list
  return (
    <div className="project-list">
      {projects.map((project) => (
        <ProjectListItem
          key={project.id}
          project={project}
          pathExists={projectPathsStatus.get(project.id) ?? true}
          onRemove={onProjectRemove}
        />
      ))}
    </div>
  );
}
