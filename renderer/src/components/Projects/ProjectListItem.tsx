/**
 * ProjectListItem
 *
 * Individual project item with hover state for delete button.
 * Shows project icon based on type and displays warning if path doesn't exist.
 */

import React, { useState } from 'react';
import { Trash2, Package, Coffee, Layers, FolderCode } from 'lucide-react';
import type { Project } from '../../../../shared/types/database';
import { Modal } from '../Modal';
import './ProjectListItem.css';

interface ProjectListItemProps {
  project: Project;
  onRemove: (id: number) => void;
  pathExists: boolean;
}

export function ProjectListItem({ project, onRemove, pathExists }: ProjectListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onRemove(project.id);
    setShowDeleteConfirm(false);
  };

  // Determine icon based on project type (detected from path or stored metadata)
  const getProjectIcon = () => {
    // For now, detect from path (package.json vs composer.json)
    // In future, this could come from ProjectService.detectProjectType
    const IconComponent = FolderCode; // Generic fallback

    // You can enhance this with actual type detection if stored in DB
    return <IconComponent size={18} className="project-icon" />;
  };

  return (
    <>
      <div
        className={`project-list-item ${!pathExists ? 'path-not-found' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="project-info">
          {getProjectIcon()}
          <div className="project-details">
            <span className="project-name">{project.name}</span>
            {!pathExists && (
              <span className="path-not-found-badge">Ruta no encontrada</span>
            )}
          </div>
        </div>

        <button
          className={`delete-button ${isHovered ? 'delete-button--visible' : ''}`}
          onClick={() => setShowDeleteConfirm(true)}
          aria-label={`Delete project ${project.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar Proyecto"
        size="sm"
        primaryAction={{
          label: 'Eliminar',
          onClick: handleDelete,
          variant: 'danger',
        }}
        secondaryAction={{
          label: 'Cancelar',
          onClick: () => setShowDeleteConfirm(false),
        }}
      >
        <p>¿Eliminar <strong>{project.name}</strong> de BMAD Studio?</p>
        <p style={{ color: '#6B7280', marginTop: '8px', fontSize: '14px' }}>
          Los archivos NO se eliminarán del sistema
        </p>
      </Modal>
    </>
  );
}
