import { ComponentLoader } from 'adminjs';
import path from 'path';

export const componentLoader = new ComponentLoader();

export const Components = {
  Dashboard: componentLoader.add(
    'Dashboard',
    path.join(process.cwd(), '/src/admin/components/dashboard/dashboard'),
  ),
  UserProfile: componentLoader.add(
    'UserProfile',
    path.join(process.cwd(), '/src/admin/components/user-profile/user-profile'),
  ),
  Statistics: componentLoader.add(
    'Statistics',
    path.join(process.cwd(), '/src/admin/components/statistics/statistics'),
  ),
};
