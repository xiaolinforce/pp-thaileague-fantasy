export function teamTabs(id: string, gw: number | undefined, current: string) {
  const query = gw ? `?gw=${gw}` : "";
  return [
    {
      href: `/admin/fantasy/participants/${id}${query}`,
      label: "ทีมที่บันทึก",
      current: current === "squad",
    },
    {
      href: `/admin/fantasy/participants/${id}/points${query}`,
      label: "คะแนนนักเตะ",
      current: current === "points",
    },
  ];
}
