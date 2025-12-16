/**
 * ProjectsView
 *
 * Main page/view for managing projects.
 * Shows header with title and add button, plus full project list.
 */

import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ProjectList } from './ProjectList';
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

          <button
            onClick={() => addProject()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10B981';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
            }}
          >
            <Plus size={16} />
            <span>Agregar Proyecto</span>
          </button>
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
