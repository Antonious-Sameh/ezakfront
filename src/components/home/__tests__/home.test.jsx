import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatusBanner from '@/components/home/StatusBanner';
import ShopCards from '@/components/home/ShopCards';
import PositionStrip from '@/components/home/PositionStrip';

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('StatusBanner', () => {
    it('says everything is fine when there is nothing to do', () => {
        wrap(<StatusBanner items={[]} />);
        expect(screen.getByRole('status')).toHaveTextContent('كل حاجة تمام');
    });

    it('counts the items in correct Arabic, red when something is urgent, and opens the list on tap', () => {
        const items = [
            { key: 'a', tone: 'danger', kind: 'offline', text: 'محل أ مش بيرد', to: '/shops/a' },
            { key: 'b', tone: 'warning', kind: 'stock', text: '٣ صنف ناقص' },
        ];
        wrap(<StatusBanner items={items} />);
        const button = screen.getByRole('button', { name: /٢ حاجتين محتاجة انتباهك/ });
        expect(button.className).toContain('rose');
        expect(screen.queryByText('محل أ مش بيرد')).not.toBeInTheDocument();

        fireEvent.click(button);
        expect(screen.getByText('محل أ مش بيرد').closest('a')).toHaveAttribute('href', '/shops/a');
    });

    it('amber (not red) when nothing is urgent', () => {
        wrap(<StatusBanner items={[{ key: 'x', tone: 'warning', kind: 'stock', text: 'نواقص' }]} />);
        expect(screen.getByRole('button').className).toContain('amber');
    });
});

describe('ShopCards', () => {
    const rows = [
        { id: 's1', name: 'سوبر ماركت المدينة الجديدة', status: 'online', customersOwe: 12300, stockCost: 65600, cash: -830, todaySales: 2067, lowCount: 2 },
        { id: 's2', name: 'بقالة النور', status: 'offline', customersOwe: null, stockCost: null, cash: null, todaySales: 0 },
    ];

    it('shows the full shop name (no "…" cut) and the four figures, compactly', () => {
        wrap(<ShopCards rows={rows} />);
        const card = screen.getByText('سوبر ماركت المدينة الجديدة').closest('a');
        expect(card).toHaveAttribute('href', '/shops/s1');
        expect(card).toHaveTextContent('١٢٫٣ ألف');
        expect(card).toHaveTextContent('٦٥٫٦ ألف');
        expect(card).toHaveTextContent('٢٬٠٦٧');
        expect(card).toHaveTextContent('٢ ناقص');
    });

    it('a negative cash balance is red', () => {
        wrap(<ShopCards rows={rows} />);
        const card = screen.getByText('سوبر ماركت المدينة الجديدة').closest('a');
        const cashValue = [...card.querySelectorAll('dt')].find((dt) => dt.textContent === 'الكاش').nextSibling;
        expect(cashValue.className).toContain('rose');
    });

    it('an offline shop says so, shows unknown as "—" (never a fake 0), and is still a link in', () => {
        wrap(<ShopCards rows={rows} />);
        const card = screen.getByText('بقالة النور').closest('a');
        expect(card).toHaveTextContent('مش بيرد دلوقتي');
        expect(card.querySelectorAll('dd')).toHaveLength(4);
        card.querySelectorAll('dd').forEach((dd) => expect(dd).toHaveTextContent('—'));
        expect(card).toHaveAttribute('href', '/shops/s2');
    });
});

describe('PositionStrip', () => {
    const position = { totals: { customersOwe: 1500, suppliersOwed: 800, cash: 400, stockCost: 6500, stockSale: 8500, net: 7600, complete: true } };

    it('the total estimate and how it is made up', () => {
        render(<PositionStrip position={position} />);
        expect(screen.getByTestId('position-net')).toHaveTextContent('٧٬٦٠٠');
        expect(screen.getByText(/كاش \+ بضاعة بالتكلفة \+ لينا عند العملاء − علينا للموردين/)).toBeInTheDocument();
    });

    it('unknown figures show "—" and the total is flagged as partial', () => {
        render(<PositionStrip position={{ totals: { ...position.totals, stockCost: null, complete: false } }} />);
        expect(screen.getByText('البضاعة (بالتكلفة)').parentElement.parentElement).toHaveTextContent('—');
        expect(screen.getByText(/ناقص محل مردّش/)).toBeInTheDocument();
    });
});
