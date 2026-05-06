import { useEffect, useState } from 'react';
import { ApiClient } from 'adminjs';
import { Box, H2, Text, Label, Loader } from '@adminjs/design-system';

const api = new ApiClient();

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    usersCount: 0,
    resourcesCount: 0,
    adminJSVersion: '',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getDashboard();
        if (mounted) {
          const payload = res?.data || {};
          setData({
            usersCount: Number(payload.usersCount) || 0,
            resourcesCount: Number(payload.resourcesCount) || 0,
            adminJSVersion: payload.adminJSVersion || '',
          });
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError('Не удалось загрузить данные дашборда');
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box
      px="lg"
      py="lg"
      style={{
        fontFamily: `'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
      }}
    >
      <Header />

      {loading ? (
        <LoaderBlock />
      ) : error ? (
        <ErrorPlaceholder text={error} />
      ) : (
        <>
          <CardsRow>
            <KpiCard
              title="Пользователи"
              value={formatNumber(data.usersCount)}
              hint="Всего в системе"
            />
            <KpiCard
              title="Ресурсы"
              value={formatNumber(data.resourcesCount)}
              hint="Всего в системе"
            />
            <KpiCard
              title="Версия AdminJS"
              value={data.adminJSVersion || '—'}
              hint="Текущая версия"
            />
          </CardsRow>

          <Box
            mt="xl"
            display="grid"
            gridTemplateColumns="1fr"
            style={{ gap: 24 }}
          >
            <Panel title="Добро пожаловать">
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                p="lg"
              >
                <img
                  src="/public/logo.png"
                  alt="AdminJS"
                  style={{
                    maxWidth: '200px',
                    marginBottom: '16px',
                    opacity: 0.9,
                  }}
                />
                <Text
                  color="grey60"
                  style={{
                    fontSize: 16,
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  Это ваша панель управления. Здесь вы найдете основные сведения
                  о системе и сможете следить за ключевыми метриками.
                </Text>
              </Box>
            </Panel>
          </Box>
        </>
      )}
    </Box>
  );
}

function Header() {
  return (
    <Box mb="xl">
      <H2
        marginBottom="xs"
        style={{ fontWeight: 700, fontSize: 28, letterSpacing: '-0.5px' }}
      >
        Панель управления
      </H2>
      <Text
        variant="sm"
        color="grey60"
        style={{ fontSize: 15, lineHeight: 1.4 }}
      >
        Краткое резюме ключевых показателей и состояния системы
      </Text>
      <hr style={{ marginTop: 14, border: 0, borderTop: '1px solid #eee' }} />
    </Box>
  );
}

function CardsRow({ children }) {
  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(auto-fit, minmax(260px, 1fr))"
      style={{ gap: 24 }}
    >
      {children}
    </Box>
  );
}

function KpiCard({ title, value, hint }) {
  return (
    <Box
      variant="container"
      border
      rounded
      p="xl"
      style={{
        background: '#fff',
        boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        cursor: 'default',
        animation: 'fadeIn 0.6s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.08)';
      }}
    >
      <Label style={{ fontSize: 14, color: '#555' }}>{title}</Label>
      <Text
        as="div"
        mt="md"
        style={{
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.2,
          color: '#111',
          transition: 'opacity 0.5s ease',
        }}
      >
        {value}
      </Text>
      {hint ? (
        <Text
          variant="sm"
          mt="xs"
          color="grey60"
          style={{
            background: '#f8f9fa',
            borderRadius: 6,
            padding: '2px 6px',
            display: 'inline-block',
            fontSize: 13,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}

function Panel({ title, children }) {
  return (
    <Box
      variant="container"
      border
      rounded
      p="xl"
      style={{
        background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
      }}
    >
      <H2 marginBottom="md" style={{ fontSize: 18, fontWeight: 600 }}>
        {title}
      </H2>
      {children}
    </Box>
  );
}

function LoaderBlock() {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: '240px' }}
    >
      <Loader />
    </Box>
  );
}

function ErrorPlaceholder({ text }) {
  return (
    <Box
      p="xl"
      style={{
        border: '1px solid #f5c2c7',
        background: '#f8d7da',
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#842029', fontWeight: 600 }}>{text}</Text>
    </Box>
  );
}

function formatNumber(n) {
  try {
    return new Intl.NumberFormat('ru-RU').format(Number(n) || 0);
  } catch {
    return String(n);
  }
}
