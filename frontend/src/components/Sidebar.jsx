import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineUserAdd,
  HiOutlineDocumentSearch,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineStar,
  HiOutlineTemplate,
  HiOutlineUsers,
} from 'react-icons/hi';

const superAdminLinks = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineViewGrid, end: true },
  { to: '/admin/students/new', label: 'Enter Student Data', icon: HiOutlineUserAdd },
  { to: '/admin/certificates/view', label: 'View Certificate', icon: HiOutlineDocumentSearch },
  { to: '/admin/courses', label: 'Manage Courses', icon: HiOutlineAcademicCap },
  { to: '/admin/faculties', label: 'Manage Faculties', icon: HiOutlineUserGroup },
  { to: '/admin/grades', label: 'Manage Grades', icon: HiOutlineStar },
  { to: '/admin/template', label: 'Manage Template', icon: HiOutlineTemplate },
];

const managementLinks = [
  { to: '/management', label: 'Dashboard', icon: HiOutlineViewGrid, end: true },
  { to: '/management/students', label: 'Student Listing', icon: HiOutlineUsers },
  { to: '/management/search', label: 'Search', icon: HiOutlineDocumentSearch },
];

export default function Sidebar({ role }) {
  const links = role === 'superadmin' ? superAdminLinks : managementLinks;

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col bg-brand-800 text-brand-50 min-h-screen">
      <div className="px-6 py-6 border-b border-white/10">
        <p className="text-lg font-bold tracking-wide">Mind Q Systems</p>
        <p className="text-xs text-brand-200 mt-0.5">Certificate Management</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-gold-500 text-brand-900' : 'text-brand-100 hover:bg-white/10'
              }`
            }
          >
            <Icon className="text-lg shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-white/10 text-[11px] text-brand-200">
        Demo build &middot; MERN stack
      </div>
    </aside>
  );
}
