import React from 'react';
import clsx from 'clsx';
import { HiDotsHorizontal } from 'react-icons/hi';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  /** Display text for the breadcrumb item */
  label: string;
  /** Optional URL – if omitted, item is considered the current page (not clickable) */
  href?: string;
  /** Optional icon element to display before the label */
  icon?: React.ReactNode;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom separator element (defaults to '/') */
  separator?: React.ReactNode;
  /** Accessible label for the navigation */
  'aria-label'?: string;
  /** Maximum number of items to display before collapsing */
  maxItems?: number;
  /** Custom render function for links (e.g., for Next.js Link or React Router) */
  renderLink?: (item: BreadcrumbItem, props: { className: string; children: React.ReactNode }) => React.ReactNode;
  /** Custom ellipsis item shown when collapsed (defaults to { label: '...', icon: <HiDotsHorizontal /> }) */
  collapsedEllipsis?: BreadcrumbItem;
}

/**
 * Breadcrumb component for navigation hierarchy.
 * Renders a list of links with separators, indicating the current page.
 *
 * @example
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/', icon: <HiHome /> },
 *     { label: 'Docs', href: '/docs' },
 *     { label: 'Components' },
 *   ]}
 *   maxItems={3}
 *   renderLink={(item, props) => <NextLink href={item.href!} className={props.className}>{props.children}</NextLink>}
 * />
 */
export const Breadcrumb = React.memo(function Breadcrumb({
  items,
  separator = '/',
  className,
  'aria-label': ariaLabel = 'Breadcrumb',
  maxItems,
  renderLink,
  collapsedEllipsis = { label: '...', icon: <HiDotsHorizontal /> },
  ...rest
}: BreadcrumbProps) {
  // Handle empty or undefined items
  if (!items || items.length === 0) {
    return null;
  }

  // Determine which items to display based on maxItems
  let displayedItems = items;
  let collapsed = false; // can be used for future features (e.g., tooltip)

  if (maxItems && items.length > maxItems) {
    const firstItems = items.slice(0, maxItems - 1);
    const lastItem = items[items.length - 1];
    // Insert the custom ellipsis item between the first items and the last item
    displayedItems = [...firstItems, collapsedEllipsis, lastItem];
    collapsed = true;
  }

  // Generate a stable key for each item
  const getItemKey = (item: BreadcrumbItem, index: number): string => {
    // If the item has an href, use it as part of the key; otherwise fall back to index + label.
    // This handles the ellipsis item which has no href.
    return item.href ? `href-${item.href}` : `item-${index}-${item.label}`;
  };

  // Render a link or plain text
  const renderItemContent = (item: BreadcrumbItem, isLast: boolean) => {
    const content = (
      <>
        {item.icon && <span className={styles.icon} aria-hidden="true">{item.icon}</span>}
        <span className={styles.label}>{item.label}</span>
      </>
    );

    if (!isLast && item.href) {
      if (renderLink) {
        // Pass className and children to custom renderer
        return renderLink(item, { className: styles.link, children: content });
      }
      return (
        <a href={item.href} className={styles.link}>
          {content}
        </a>
      );
    }

    return (
      <span
        className={isLast ? styles.current : styles.link}
        aria-current={isLast ? 'page' : undefined}
      >
        {content}
      </span>
    );
  };

  return (
    <nav
      className={clsx(styles.breadcrumb, className)}
      aria-label={ariaLabel}
      {...rest}
    >
      <ol className={styles.list}>
        {displayedItems.map((item, index) => {
          const isLast = index === displayedItems.length - 1;

          return (
            <li key={getItemKey(item, index)} className={styles.item}>
              {renderItemContent(item, isLast)}
              {!isLast && (
                <span className={styles.separator} aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

export default Breadcrumb;