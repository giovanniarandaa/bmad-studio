/**
 * ProjectsView
 *
 * Main page/view for managing projects.
 * Shows header with title and add button, plus full project list.
 */

import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ProjectList } from './ProjectList';
import { Button } from '../Button';
import { useProjectStore } from '../../stores/projectStore';

export function ProjectsView() {
  const { projects, projectPathsStatus, projectsLoading, loadProjects, addProject, removeProject } =
    useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '8px',
                color: '#1F2937',
              }}
            >
              Mis Proyectos
            </h1>
            <p style={{ color: '#6B7280', fontSize: '16px', lineHeight: '1.6' }}>
              Gestiona tus proyectos de desarrollo
            </p>
          </div>

          <Button
            label="Agregar Proyecto"
            onClick={() => addProject()}
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
          />
        </div>

        {/* Content */}
        {projectsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
            Cargando proyectos...
          </div>
        ) : (
          <ProjectList
            projects={projects}
            projectPathsStatus={projectPathsStatus}
            onProjectRemove={removeProject}
            onAddProject={() => addProject()}
          />
        )}
      </div>
    </div>
  );
}
