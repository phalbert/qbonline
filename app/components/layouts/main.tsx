import Navbar from "~/components/layouts/navbar";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {

    return (
        <>
            <div className="min-h-full bg-gray-200">
                <Navbar />

                {/* <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl py-4 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                    </div>
                </header> */}
                <main>
                    <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </>
    )
}