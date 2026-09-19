import { Container } from '../ui/Container'
import { footerNavigation } from '../../data/footer'
import styles from './SiteFooter.module.css'

const socialIcons = [
  {
    name: 'Facebook',
    path: 'M18.4 9h-2.1c-2.1 0-3.2 1.3-3.2 3.4V14h-1.8v2.8h1.8V23h3.1v-6.2h2.1l.4-2.8h-2.5v-1.4c0-.6.3-.9.9-.9h1.3V9Z',
  },
  {
    name: 'GitHub',
    path: 'M16 8.7a7.5 7.5 0 0 0-2.4 14.6c.4.1.5-.2.5-.4v-1.3c-2.1.5-2.5-.9-2.5-.9-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.9 2.2.7.1-.5.3-.9.5-1.1-1.7-.2-3.5-.8-3.5-3.8 0-.8.3-1.5.8-2.1-.1-.2-.3-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3-1.8 3.6-3.5 3.8.3.3.5.8.5 1.5v2.3c0 .2.1.5.5.4A7.5 7.5 0 0 0 16 8.7Z',
  },
  {
    name: 'Twitter',
    path: 'M23.3 11.6c-.5.2-1 .4-1.6.4.6-.4 1-.9 1.2-1.5-.5.3-1.1.5-1.8.7a2.8 2.8 0 0 0-4.8 2.5c-2.4-.1-4.5-1.3-5.9-3a2.8 2.8 0 0 0 .9 3.7c-.5 0-.9-.1-1.3-.3 0 1.4 1 2.5 2.2 2.8-.4.1-.8.2-1.3.1.4 1.1 1.4 1.9 2.6 1.9a5.6 5.6 0 0 1-3.5 1.2h-.7a8 8 0 0 0 4.3 1.2c5.2 0 8-4.3 8-8v-.4c.6-.4 1.1-.9 1.5-1.5Z',
  },
  {
    name: 'Google',
    path: 'M23.2 16.2c0-.5 0-.9-.1-1.3H16v2.7h4.1a3.5 3.5 0 0 1-1.5 2.3v1.8h2.3a7 7 0 0 0 2.3-5.5ZM16 23.5c2 0 3.7-.7 4.9-1.8l-2.3-1.8c-.7.5-1.5.8-2.6.8a4.7 4.7 0 0 1-4.4-3.2H9.3v1.9a7.5 7.5 0 0 0 6.7 4.1ZM11.6 17.5a4.5 4.5 0 0 1 0-3V12.6H9.3a7.5 7.5 0 0 0 0 6.8l2.3-1.9ZM16 11.3c1.1 0 2.1.4 2.9 1.1l2-2A7.2 7.2 0 0 0 16 8.5a7.5 7.5 0 0 0-6.7 4.1l2.3 1.9a4.7 4.7 0 0 1 4.4-3.2Z',
  },
] as const

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.columns}>
          <div className={styles.about}>
            <h2>About Us</h2>
            <p>
              We build AI-powered SaaS tools that help modern teams automate
              workflows, connect business processes, and move faster with less
              manual work.
            </p>
          </div>

          {footerNavigation.map(({ heading, links }) => (
            <nav className={styles.linkGroup} aria-label={heading} key={heading}>
              <h2>{heading}</h2>
              <ul>
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className={styles.contact}>
            <h2>Connect With Us</h2>
            <a href="mailto:hello@yourbrand.ai">hello@yourbrand.ai</a>
            <a href="mailto:support@yourbrand.ai">support@yourbrand.ai</a>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© 2026 All Right Reserved.</p>
          <div aria-hidden="true">
            <ul className={styles.socialLinks}>
              {socialIcons.map(({ name, path }) => (
                <li key={name}>
                  <span>
                    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" />
                      <path d={path} fill="currentColor" />
                    </svg>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  )
}
