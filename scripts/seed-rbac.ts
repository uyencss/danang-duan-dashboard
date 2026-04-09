import { UserRole } from '@prisma/client';
import prisma from '../src/lib/prisma';

const MENU_ITEMS = [
  // SECTION: main
  { key: 'dashboard', label: 'Dashboard Tổng quan', href: '/', icon: 'LayoutDashboard', section: 'main', sortOrder: 1 },
  { key: 'crm-du-an', label: 'CRM & DS Dự án', href: '/du-an', icon: 'Briefcase', section: 'main', sortOrder: 2 },
  { key: 'khach-hang', label: 'Khách hàng', href: '/admin/khach-hang', icon: 'Users', section: 'main', sortOrder: 3 },
  { key: 'kpi', label: 'Phân tích & KPI', href: '/kpi', icon: 'BarChart2', section: 'main', sortOrder: 4 },
  { key: 'dia-ban', label: 'Top Địa bàn', href: '/dia-ban', icon: 'MapPin', section: 'main', sortOrder: 5 },
  { key: 'quan-ly-am', label: 'Quản lý AM', href: '/quan-ly-am', icon: 'UserCircle', section: 'main', sortOrder: 6 },
  { key: 'quan-ly-cv', label: 'Quản lý Chuyên viên', href: '/quan-ly-cv', icon: 'UserCheck', section: 'main', sortOrder: 7 },
  
  // SECTION: admin
  { key: 'san-pham', label: 'Sản phẩm', href: '/admin/san-pham', icon: 'Box', section: 'admin', sortOrder: 1 },
  { key: 'users', label: 'Quản lý User', href: '/admin/users', icon: 'Users', section: 'admin', sortOrder: 2 },
  { key: 'giao-kpi', label: 'Giao KPI', href: '/admin/kpi', icon: 'Target', section: 'admin', sortOrder: 3 },
  { key: 'tracking', label: 'Theo dõi các bước', href: '/du-an/tracking', icon: 'GitMerge', section: 'admin', sortOrder: 4 },
  { key: 'du-an-da-xoa', label: 'Dự án đã xoá', href: '/admin/du-an-da-xoa', icon: 'Trash2', section: 'admin', sortOrder: 5 },
  { key: 'email-service', label: 'Email Service', href: '/email-service', icon: 'Mail', section: 'admin', sortOrder: 6 },
  { key: 'roles', label: 'Phân quyền', href: '/admin/roles', icon: 'Shield', section: 'admin', sortOrder: 7 },

  // SECTION: cta
  { key: 'tao-moi', label: 'Khởi tạo Dự án CĐS', href: '/du-an/tao-moi', icon: 'PlusCircle', section: 'cta', sortOrder: 1 },
];

const ROLES_METADATA = [
  { role: UserRole.ADMIN, label: 'Quản trị viên (Admin)', description: 'Toàn quyền truy cập và cài đặt hệ thống', color: 'purple' },
  { role: UserRole.USER, label: 'Nhân viên (Legacy)', description: 'Quyền truy cập cơ bản', color: 'gray' },
  { role: UserRole.AM, label: 'Account Manager (AM)', description: 'Quản lý khách hàng và dự án', color: 'blue' },
  { role: UserRole.CV, label: 'Chuyên viên (CV)', description: 'Thực hiện dự án và hỗ trợ kỹ thuật', color: 'emerald' },
];

async function main() {
  console.log('🌱 Bắt đầu seed RBAC data (MenuItem, RoleConfig, MenuPermission)...');

  // 1. Seed MenuItems
  console.log('\n--- Seeding MenuItems ---');
  for (const item of MENU_ITEMS) {
    const upserted = await prisma.menuItem.upsert({
      where: { key: item.key },
      update: {
        label: item.label,
        href: item.href,
        icon: item.icon,
        section: item.section,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: item,
    });
    console.log(`✅ MenuItem: ${upserted.label} (${upserted.key})`);
  }

  // 2. Seed RoleConfigs
  console.log('\n--- Seeding RoleConfigs ---');
  for (const rc of ROLES_METADATA) {
    const upserted = await prisma.roleConfig.upsert({
      where: { role: rc.role },
      update: {
        label: rc.label,
        description: rc.description,
        color: rc.color,
      },
      create: rc,
    });
    console.log(`✅ RoleConfig: ${upserted.label} (${upserted.role})`);
  }

  // 3. Seed MenuPermissions
  // AM/CV: canView=true chỉ cho Dashboard, CRM, Khách hàng, Giao KPI, Khởi tạo Dự án
  const amCvAllowedMenus = ['dashboard', 'crm-du-an', 'khach-hang', 'giao-kpi', 'tao-moi'];

  console.log('\n--- Seeding MenuPermissions ---');
  const allRoles = Object.values(UserRole);
  const allMenuKeys = MENU_ITEMS.map(m => m.key);

  for (const role of allRoles) {
    for (const menuKey of allMenuKeys) {
      let canView = false;
      let canCreate = false;
      let canEdit = false;
      let canDelete = false;

      if (role === UserRole.ADMIN || role === UserRole.USER) {
        canView = true;
        if (role === UserRole.ADMIN) {
          canView = true;
          canCreate = true;
          canEdit = true;
          canDelete = true;
        }
      } else if (role === UserRole.AM || role === UserRole.CV) {
        if (amCvAllowedMenus.includes(menuKey)) {
          canView = true;
          if (['crm-du-an', 'tao-moi'].includes(menuKey)) {
            canCreate = true;
            canEdit = true;
          }
        }
      }

      await prisma.menuPermission.upsert({
        where: {
          menuKey_role: {
            menuKey: menuKey,
            role: role,
          }
        },
        update: {
          canView,
          canCreate,
          canEdit,
          canDelete,
        },
        create: {
          menuKey,
          role,
          canView,
          canCreate,
          canEdit,
          canDelete,
        }
      });
    }
    console.log(`✅ MenuPermissions updated for role: ${role}`);
  }

  console.log('\n🎉 Hoàn thành seed RBAC data!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });