import React, { useEffect } from 'react';

/**
 * Minimal drop-in for react-helmet's <Helmet>, covering exactly what this
 * app uses it for: a page <title> and <meta name="description">.
 * react-helmet (+ its dependencies) cost ~6 KB gzipped on every first load
 * for these two tags.
 *
 *   <Helmet>
 *     <title>{`المبيعات — لوحة تحكم المحلات`}</title>
 *     <meta name="description" content="..." />
 *   </Helmet>
 */
export function readHeadChildren(children) {
    let title = null;
    let description = null;
    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        if (child.type === 'title') {
            const parts = React.Children.toArray(child.props.children);
            title = parts.join('');
        } else if (child.type === 'meta' && child.props.name === 'description') {
            description = child.props.content ?? null;
        }
    });
    return { title, description };
}

export function Helmet({ children }) {
    const { title, description } = readHeadChildren(children);

    useEffect(() => {
        if (title) document.title = title;
    }, [title]);

    useEffect(() => {
        if (description === null) return;
        let tag = document.head.querySelector('meta[name="description"]');
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('name', 'description');
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', description);
    }, [description]);

    return null;
}

export default Helmet;
