import React from 'react'

/** Dark brand column of the login screen. Collapses to a compact header below `lg`. */
export const LoginBrandPanel: React.FC = () => {
  return (
    <section
      aria-label="About Staffora"
      className="flex flex-col justify-center bg-brand-ink px-6 py-10 sm:px-12 lg:min-h-screen lg:px-[72px] lg:py-0"
    >
      <div className="max-w-[460px] lg:-mt-[180px]">
        <p className="font-brand text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[48px] lg:leading-[56px]">
          Staffora
        </p>
        <p className="mt-1 font-brand text-lg font-medium text-brand-accent sm:text-xl">Right People. Right Project.</p>
        <p className="mt-6 hidden text-base leading-relaxed text-slate-300 sm:block lg:mt-10">
          Plan workforce capacity, find the right skills, and allocate resources without overloading your people.
        </p>
      </div>
    </section>
  )
}
