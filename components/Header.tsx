import Link from 'next/link'
import { getProfile } from '@/lib/auth'
import { logout } from '@/app/login/actions'
import ThemeToggle from '@/components/ThemeToggle'

export default async function Header() {
  const profile = await getProfile()
  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator'

  return (
    <header className="gg-header">

      {/* ---------- вывеска ---------- */}
      <div className="gg-header__crown">
        <Link href="/" className="gg-brand">
          <span className="gg-brand__name">Grim Grace</span>
          <span className="gg-brand__rule">
            <i /> <b>❦</b> <i />
          </span>
          <span className="gg-brand__sub">Лондон · MDCCCLXXXVIII</span>
        </Link>
      </div>

      {/* ---------- полоса навигации ---------- */}
      <div className="gg-header__bar">
        <div className="gg-header__inner">

          <nav className="gg-nav">
            <Link href="/roster" className="gg-nav__link">Ростер</Link>
            <span className="gg-nav__dot">·</span>
            <a
              href="https://grimgrace.example"
              target="_blank"
              rel="noreferrer"
              className="gg-nav__link"
            >
              Лор
            </a>
            {profile && (
              <>
                <span className="gg-nav__dot">·</span>
                <Link href="/dashboard" className="gg-nav__link">Кабинет</Link>
                <span className="gg-nav__dot">·</span>
                <Link href="/my" className="gg-nav__link">Мои посты</Link>
              </>
            )}
            {isStaff && (
              <>
                <span className="gg-nav__dot">·</span>
                <Link href="/admin/roster" className="gg-nav__link gg-nav__link--staff">
                  Админка
                </Link>
              </>
            )}
          </nav>

          <div className="gg-user">
            <ThemeToggle />
            {profile ? (
              <>
                <span className="gg-user__name">@{profile.username}</span>
                <form action={logout}>
                  <button className="gg-user__link">Выйти</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="gg-user__link">Войти</Link>
            )}
          </div>

        </div>
      </div>

    </header>
  )
}