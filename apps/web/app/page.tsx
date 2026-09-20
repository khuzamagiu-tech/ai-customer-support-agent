const stats = [
  { label: 'Open conversations', value: '24', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { label: 'Resolved today', value: '9', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { label: 'High priority', value: '6', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { label: 'Active customers', value: '128', tone: 'bg-violet-50 text-violet-700 ring-violet-200' },
];

const tickets = [
  { customer: 'Alicia Flores', subject: 'Subscription refund request', priority: 'Urgent', status: 'Open', owner: 'Maya' },
  { customer: 'Kris Nguyen', subject: 'Password reset loop', priority: 'High', status: 'Pending', owner: 'Jordan' },
  { customer: 'Marcus Bell', subject: 'Shipping delay on order #1042', priority: 'Normal', status: 'Open', owner: 'Taylor' },
  { customer: 'Dina Patel', subject: 'Billing mismatch notice', priority: 'High', status: 'Resolved', owner: 'Alina' },
];

const knowledge = [
  { title: 'Refund policy and exceptions', category: 'Billing', updated: '2h ago' },
  { title: 'Password reset and MFA recovery', category: 'Accounts', updated: '5h ago' },
  { title: 'Order delay escalation workflow', category: 'Fulfillment', updated: '1d ago' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Support operations</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">AI Customer Support Agent</h1>
          </div>
          <button type="button" className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800">
            New conversation
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className={`rounded-2xl border border-slate-200 p-4 ring-1 ${item.tone}`}>
              <p className="text-sm font-medium text-slate-600">{item.label}</p>
              <p className="mt-3 text-3xl font-bold tracking-tight">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent conversations</h2>
              <span className="text-sm text-slate-500">Updated 8 minutes ago</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {tickets.map((ticket) => (
                    <tr key={`${ticket.customer}-${ticket.subject}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">{ticket.customer}</td>
                      <td className="px-4 py-3 text-slate-600">{ticket.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          ticket.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' :
                          ticket.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                          'bg-sky-100 text-sky-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{ticket.status}</td>
                      <td className="px-4 py-3 text-slate-600">{ticket.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">AI recommendations</h2>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                <li className="rounded-lg bg-sky-50 px-3 py-2">Billing issue detected: refund review recommended.</li>
                <li className="rounded-lg bg-emerald-50 px-3 py-2">Suggested response drafted with policy references.</li>
                <li className="rounded-lg bg-violet-50 px-3 py-2">Knowledge article match: refund policy exceptions.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Knowledge base</h2>
              <div className="mt-4 space-y-3">
                {knowledge.map((article) => (
                  <div key={article.title} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-800">{article.title}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {article.category}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Updated {article.updated}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
