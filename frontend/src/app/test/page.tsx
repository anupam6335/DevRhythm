'use client';

import React from 'react';
import Logo from '@/shared/components/Logo';
import styles from './page.module.css';
import ThemeToggle from '@/shared/components/ThemeToggle';

export default function TestPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Logo Component Test <ThemeToggle variant='both'/> </h1>

      <section className={styles.section}>
        <h2>Default (horizontal, md, all animations enabled)</h2>
        <Logo />
      </section>

      <section className={styles.section}>
        <h2>Vertical layout, large size</h2>
        <Logo layout="vertical" size="lg" />
      </section>

      <section className={styles.section}>
        <h2>Small size, horizontal</h2>
        <Logo size="sm" />
      </section>

      <section className={styles.section}>
        <h2>Disabled initial animation (text appears immediately)</h2>
        <Logo animateOnLoad={false} />
      </section>

      <section className={styles.section}>
        <h2>Disabled scroll fade (image stays visible)</h2>
        <Logo enableScrollFade={false} />
      </section>

      <section className={styles.section}>
        <h2>Custom scroll fade threshold (300px)</h2>
        <Logo scrollFadeThreshold={300} />
      </section>

      <section className={styles.section}>
        <h2>All props customised (vertical, small, both animations off)</h2>
        <Logo
          layout="vertical"
          size="sm"
          animateOnLoad={false}
          enableScrollFade={false}
        />
      </section>

      {/* Long text to enable scrolling */}
      <div className={styles.longText}>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p>
          Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.
        </p>
        <p>
          Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin vel ante a orci tempus eleifend ut et magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus luctus urna sed urna ultricies ac tempor dui sagittis. In condimentum facilisis porta. Sed nec diam eu diam mattis viverra. Nulla fringilla, orci ac euismod semper, magna diam porttitor mauris, quis sollicitudin sapien justo in libero.
        </p>
        <p>
          Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Maecenas ullamcorper, dui et placerat feugiat, eros pede varius nisi, condimentum viverra felis nunc et lorem. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt.
        </p>
        <p>
          Aliquam erat volutpat. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
        </p>
        <p>
          Donec vitae orci sed dolor rutrum auctor. Fusce egestas elit eget lorem. Suspendisse nisl elit, rhoncus eget, elementum ac, condimentum eget, diam. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero.
        </p>
      </div>
    </div>
  );
}