import { ComponentLoader } from 'adminjs';
import path from 'path';

export const componentLoader = new ComponentLoader();

/**
 * Объект всех кастомных компонентов
 */
export const Components = {
  Dashboard: componentLoader.add(
    'Dashboard',
    path.join(process.cwd(), '/src/admin/components/dashboard/dashboard'),
  ),
};
