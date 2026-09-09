import React from 'react';
import { Search, X, Calendar, SlidersHorizontal } from 'lucide-react';

/**
 * Filter bar shared by every list section: search + date range (from/to)
 * + any section-specific selects passed via `extraFilters`.
 */
export default function FilterBar({
    search, onSearchChange,
    from, to, onDateChange,
    extraFilters = [], extras = {}, onExtraChange,
    onReset, showReset,
}) {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs dir-rtl transition-all">
            {/* الصف الرئيسي: البحث والتاريخ */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                
                {/* حقل البحث */}
                <div className="relative flex-1">
                    <Search 
                        className="pointer-events-none absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-muted-foreground/80 transition-colors" 
                        strokeWidth={2} 
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="ابحث بالنص، السند، أو اسم العميل..."
                        aria-label="بحث"
                        className="min-h-[44px] w-full rounded-xl border border-input/80 bg-background/50 ps-10 pe-4 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-2xs"
                    />
                </div>

                {/* حقول النطاق الزمني (من / إلى) */}
                <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center">
                    <div className="flex-1 sm:w-40">
                        <label className="relative flex flex-col">
                            <span className="mb-1 text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                من تاريخ
                            </span>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => onDateChange('from', e.target.value)}
                                aria-label="من تاريخ"
                                className="min-h-[42px] w-full rounded-xl border border-input/80 bg-background/50 px-3 py-2 text-xs font-semibold sm:text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-2xs"
                            />
                        </label>
                    </div>

                    <div className="flex-1 sm:w-40">
                        <label className="relative flex flex-col">
                            <span className="mb-1 text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                إلى تاريخ
                            </span>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => onDateChange('to', e.target.value)}
                                aria-label="إلى تاريخ"
                                className="min-h-[42px] w-full rounded-xl border border-input/80 bg-background/50 px-3 py-2 text-xs font-semibold sm:text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-2xs"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* الصف الثاني: الفلاتر الإضافية وزر المسح */}
            {(extraFilters.length > 0 || showReset) && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3.5">
                    {extraFilters.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2.5 flex-1">
                            <span className="text-xs font-bold text-muted-foreground/80 flex items-center gap-1.5 ms-0.5 me-1">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                                تصفية حسب:
                            </span>
                            {extraFilters.map((f) => (
                                <div key={f.key} className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
                                    <span className="text-xs font-medium text-muted-foreground px-1.5">{f.label}</span>
                                    <select
                                        value={extras[f.key] || 'all'}
                                        onChange={(e) => onExtraChange(f.key, e.target.value)}
                                        aria-label={f.label}
                                        className="min-h-[34px] rounded-lg border border-input/80 bg-background px-3 py-1 text-xs font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs cursor-pointer"
                                    >
                                        {f.options.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    ) : <div />}

                    {showReset ? (
                        <button
                            type="button"
                            onClick={onReset}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-1.5 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-[0.97] ms-auto"
                        >
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                            مسح الفلاتر
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
}