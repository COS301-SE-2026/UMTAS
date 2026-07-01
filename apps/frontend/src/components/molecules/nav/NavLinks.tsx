import { NavLink } from "@/components/atoms/nav/NavLink";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/builder", label: "Event Builder" },
  { href: "/customise", label: "Customisation" },
  { href: "/schedules", label: "My Schedules" },
  { href: "/choose-institute", label: "Choose Institute" },
] as const;

export function NavLinks() {
  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-6 list-none m-0 p-0">
        {NAV_ITEMS.map(({ href, label }) => (
          <li key={href}>
            <NavLink href={href}>{label}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
