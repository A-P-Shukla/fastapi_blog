export default function Sidebar() {
  return (
    <aside className="bg-white dark:bg-[#2d2d2d] border border-[#ddd] dark:border-[#404040] rounded-lg shadow-sm px-6 py-5 mb-4">
      <h3 className="font-heading font-semibold text-[#444] dark:text-[#f0f0f0] mb-2">Our Sidebar</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">You can put any information here you&apos;d like.</p>
      <ul className="divide-y divide-gray-100 dark:divide-[#404040] text-sm text-gray-600 dark:text-gray-300">
        {["Latest Posts", "Announcements", "Calendars", "etc"].map((item) => (
          <li key={item} className="py-1.5">{item}</li>
        ))}
      </ul>
    </aside>
  );
}
