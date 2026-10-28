import { useMemo } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatINR } from '../lib/format.js';
import { formatMonth } from '../lib/dates.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  Filler,
);

ChartJS.defaults.font.family = "'Manrope Variable', ui-sans-serif, sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = '#779487';

const tooltipStyle = {
  backgroundColor: 'rgba(19, 29, 25, 0.94)',
  titleColor: '#fffdf8',
  bodyColor: '#e5eae8',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  titleFont: { size: 11, weight: '700' },
  bodyFont: { size: 11, weight: '500' },
  displayColors: false,
};

export function SpendingDonut({ items = [], totalPaise = 0, height = 210 }) {
  const data = useMemo(
    () => ({
      labels: items.map((item) => item.label),
      datasets: [
        {
          data: items.map((item) => item.amountPaise),
          backgroundColor: items.map((item) => item.color),
          borderWidth: 0,
          hoverOffset: 5,
          spacing: 2,
        },
      ],
    }),
    [items],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '76%',
      animation: { animateRotate: true, duration: 700 },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: (context) => ` ${formatINR(context.raw)}`,
          },
        },
      },
    }),
    [],
  );

  if (!items.length || totalPaise <= 0) {
    return (
      <div className="relative grid place-items-center" style={{ height }}>
        <div className="grid h-36 w-36 place-items-center rounded-full border-[18px] border-ink-100 dark:border-white/[0.06]">
          <p className="text-center text-[10px] font-semibold text-ink-400">
            No spending
            <br />
            yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <Doughnut data={data} options={options} />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-400">Spent</p>
          <p className="mt-0.5 font-display text-2xl font-semibold tracking-[-0.03em] text-ink-950 dark:text-white">
            {formatINR(totalPaise, { compact: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DailySpendChart({ series = [], height = 220 }) {
  const data = useMemo(
    () => ({
      labels: series.map((day) => day.day),
      datasets: [
        {
          label: 'Spent',
          data: series.map((day) => day.expensePaise),
          backgroundColor: '#2B9966',
          hoverBackgroundColor: '#176243',
          borderRadius: 5,
          borderSkipped: false,
          maxBarThickness: 18,
        },
      ],
    }),
    [series],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            title: (context) => `Day ${context[0].label}`,
            label: (context) => ` ${formatINR(context.raw)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#779487',
            maxTicksLimit: 10,
            font: { size: 10 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(119, 148, 135, 0.12)' },
          border: { display: false },
          ticks: {
            color: '#779487',
            font: { size: 10 },
            maxTicksLimit: 5,
            callback: (value) => formatINR(value, { compact: true }),
          },
        },
      },
    }),
    [],
  );

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export function MonthlyTrendChart({ trend = [], height = 230 }) {
  const data = useMemo(
    () => ({
      labels: trend.map((item) => formatMonth(item.month, 'short')),
      datasets: [
        {
          label: 'Income',
          data: trend.map((item) => item.incomePaise),
          backgroundColor: '#2B9966',
          borderRadius: 5,
          borderSkipped: false,
          maxBarThickness: 22,
        },
        {
          label: 'Expenses',
          data: trend.map((item) => item.expensePaise),
          backgroundColor: '#E78C73',
          borderRadius: 5,
          borderSkipped: false,
          maxBarThickness: 22,
        },
      ],
    }),
    [trend],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 7,
            boxHeight: 7,
            padding: 16,
            color: '#779487',
            font: { size: 10, weight: '600' },
          },
        },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${formatINR(context.raw)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#779487', font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(119, 148, 135, 0.12)' },
          border: { display: false },
          ticks: {
            color: '#779487',
            font: { size: 10 },
            maxTicksLimit: 5,
            callback: (value) => formatINR(value, { compact: true }),
          },
        },
      },
    }),
    [],
  );

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
