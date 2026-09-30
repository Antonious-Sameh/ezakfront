import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Helmet } from '@/components/Head';

describe('Head (react-helmet replacement)', () => {
    it('sets the document title from a <title> child, including template strings', () => {
        const section = 'المبيعات';
        render(
            <Helmet>
                <title>{`${section} — لوحة تحكم المحلات`}</title>
            </Helmet>,
        );
        expect(document.title).toBe('المبيعات — لوحة تحكم المحلات');
    });

    it('creates or updates <meta name="description">', () => {
        const { rerender } = render(
            <Helmet>
                <meta name="description" content="أول وصف" />
            </Helmet>,
        );
        expect(document.head.querySelector('meta[name="description"]').getAttribute('content')).toBe('أول وصف');

        rerender(
            <Helmet>
                <meta name="description" content="وصف جديد" />
            </Helmet>,
        );
        expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
        expect(document.head.querySelector('meta[name="description"]').getAttribute('content')).toBe('وصف جديد');
    });

    it('renders nothing into the page itself', () => {
        const { container } = render(<Helmet><title>x</title></Helmet>);
        expect(container).toBeEmptyDOMElement();
    });
});
