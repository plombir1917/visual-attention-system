import { useEffect, useState } from 'react';
import { useCurrentAdmin, ApiClient } from 'adminjs';
import { Box, H2, H3, Text, Label, Loader, Button } from '@adminjs/design-system';

const api = new ApiClient();

export default function UserProfile() {
  const [currentAdmin] = useCurrentAdmin();
  const [fetching, setFetching] = useState(false);
  const [profile, setProfile] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (!currentAdmin?.id) return;

    setFetching(true);

    api
      .recordAction({
        resourceId: 'user',
        recordId: currentAdmin.id,
        actionName: 'show',
      })
      .then((response) => {
        const params = response.data?.record?.params ?? null;
        setProfile(params);
        setHasApiKey(!!params?.has_api_key);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [currentAdmin?.id]);

  if (!currentAdmin) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" style={{ minHeight: 240 }}>
        <Loader />
      </Box>
    );
  }

  const name = profile?.name ?? '—';
  const email = profile?.email ?? currentAdmin?.email ?? '—';
  const role = currentAdmin?.role ?? 'user';
  const createdAt = profile?.created_at ? formatDate(profile.created_at) : '—';
  const userId = profile?.id ?? currentAdmin?.id ?? '—';

  return (
    <Box
      px="xl"
      py="xl"
      style={{ fontFamily: `'Segoe UI', Roboto, Helvetica, Arial, sans-serif`, maxWidth: 760 }}
    >
      <PageHeader />

      <ProfileCard
        name={name}
        email={email}
        role={role}
        createdAt={createdAt}
        userId={userId}
        fetching={fetching}
      />

      <Box mt="xl">
        <ApiKeyBlock
          userId={currentAdmin?.id}
          hasApiKey={hasApiKey}
          onKeyGenerated={() => setHasApiKey(true)}
        />
      </Box>
    </Box>
  );
}

// ─── Profile card ────────────────────────────────────────────────────────────

function ProfileCard({ name, email, role, createdAt, userId, fetching }) {
  return (
    <Box
      variant="container"
      border
      rounded
      p="xxl"
      style={{ background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
    >
      <AvatarBlock name={name} email={email} />

      {fetching && (
        <Box display="flex" alignItems="center" style={{ gap: 8, marginTop: 16 }}>
          <Loader />
          <Text variant="sm" color="grey60">Загрузка данных…</Text>
        </Box>
      )}

      <hr style={{ margin: '24px 0', border: 0, borderTop: '1px solid #f0f0f0' }} />

      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(280px, 1fr))"
        style={{ gap: 20 }}
      >
        <Field label="Имя" value={name} />
        <Field label="Email" value={email} />
        <Field label="ID пользователя" value={userId} mono />
        <Field label="Дата регистрации" value={createdAt} />
        <FieldRole role={role} />
      </Box>
    </Box>
  );
}

// ─── API Key block ────────────────────────────────────────────────────────────

function ApiKeyBlock({ userId, hasApiKey, onKeyGenerated }) {
  const [generatedKey, setGeneratedKey] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  async function handleGenerate() {
    if (!userId) return;
    setGenerating(true);
    setGenError('');
    setConfirmRegen(false);

    try {
      const response = await api.recordAction({
        resourceId: 'user',
        recordId: userId,
        actionName: 'generate-api-key',
      });

      const key = response.data?.generatedKey;
      if (!key) throw new Error('Ключ не получен от сервера');

      setGeneratedKey(key);
      onKeyGenerated();
    } catch (e) {
      setGenError(e?.message ?? 'Не удалось сгенерировать ключ');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied
    }
  }

  return (
    <Box
      variant="container"
      border
      rounded
      p="xxl"
      style={{ background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
    >
      <SectionHeader
        title="API-ключ"
        subtitle="Используется для программного доступа к сервису"
      />

      <hr style={{ margin: '20px 0', border: 0, borderTop: '1px solid #f0f0f0' }} />

      {/* Status row */}
      <Box display="flex" alignItems="center" style={{ gap: 10, marginBottom: 20 }}>
        <Box
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: hasApiKey ? '#22c55e' : '#d1d5db',
            flexShrink: 0,
          }}
        />
        <Text style={{ fontSize: 15, color: hasApiKey ? '#15803d' : '#6b7280' }}>
          {hasApiKey ? 'Ключ сгенерирован' : 'Ключ не выдан'}
        </Text>
      </Box>

      {/* Generated key reveal (shown only right after generation) */}
      {generatedKey && (
        <Box
          mb="lg"
          p="lg"
          style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: 8,
          }}
        >
          <Box display="flex" alignItems="center" style={{ gap: 6, marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
              Сохраните ключ — он отображается только один раз
            </Text>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            style={{ gap: 8, flexWrap: 'wrap' }}
          >
            <Box
              style={{
                flex: 1,
                minWidth: 0,
                background: '#fff',
                border: '1px solid #fcd34d',
                borderRadius: 6,
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: 14,
                wordBreak: 'break-all',
                color: '#111',
                userSelect: 'all',
              }}
            >
              {generatedKey}
            </Box>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopy}
              style={{ flexShrink: 0 }}
            >
              {copied ? 'Скопировано ✓' : 'Копировать'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Error */}
      {genError && (
        <Box
          mb="lg"
          p="md"
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 6,
          }}
        >
          <Text style={{ color: '#b91c1c', fontSize: 14 }}>{genError}</Text>
        </Box>
      )}

      {/* Actions */}
      {confirmRegen ? (
        <Box display="flex" alignItems="center" style={{ gap: 12, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 14, color: '#b45309', fontWeight: 500 }}>
            Текущий ключ будет аннулирован. Продолжить?
          </Text>
          <Button
            variant="danger"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Генерация…' : 'Да, перегенерировать'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setConfirmRegen(false)}
            disabled={generating}
          >
            Отмена
          </Button>
        </Box>
      ) : (
        <Button
          variant={hasApiKey ? 'default' : 'contained'}
          size="sm"
          onClick={hasApiKey ? () => setConfirmRegen(true) : handleGenerate}
          disabled={generating || !userId}
        >
          {generating
            ? 'Генерация…'
            : hasApiKey
            ? 'Перегенерировать ключ'
            : 'Сгенерировать ключ'}
        </Button>
      )}
    </Box>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function PageHeader() {
  return (
    <Box mb="xl">
      <H2 style={{ fontWeight: 700, fontSize: 26, letterSpacing: '-0.5px' }}>
        Мой профиль
      </H2>
      <Text variant="sm" color="grey60" style={{ fontSize: 14, lineHeight: 1.4 }}>
        Информация о вашей учётной записи
      </Text>
      <hr style={{ marginTop: 14, border: 0, borderTop: '1px solid #eee' }} />
    </Box>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <Box>
      <H3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111' }}>{title}</H3>
      {subtitle && (
        <Text color="grey60" style={{ fontSize: 13, marginTop: 4 }}>
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

function AvatarBlock({ name, email }) {
  const displayName = name !== '—' ? name : email;
  const initials = getInitials(displayName);

  return (
    <Box display="flex" alignItems="center" style={{ gap: 20 }}>
      <Box
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#3040D6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
          {initials}
        </Text>
      </Box>
      <Box>
        <H3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>
          {displayName}
        </H3>
        <Text color="grey60" style={{ fontSize: 14 }}>
          {email}
        </Text>
      </Box>
    </Box>
  );
}

function Field({ label, value, mono = false }) {
  return (
    <Box>
      <Label
        style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color: '#888',
          marginBottom: 6,
        }}
      >
        {label}
      </Label>
      <Text
        style={{
          fontSize: 15,
          color: '#222',
          wordBreak: 'break-all',
          fontFamily: mono ? 'monospace' : 'inherit',
          background: mono ? '#f8f8f8' : 'transparent',
          padding: mono ? '3px 6px' : '0',
          borderRadius: mono ? 4 : 0,
          display: 'inline-block',
        }}
      >
        {value}
      </Text>
    </Box>
  );
}

function FieldRole({ role }) {
  const isAdmin = role === 'admin';
  return (
    <Box>
      <Label
        style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color: '#888',
          marginBottom: 6,
        }}
      >
        Роль
      </Label>
      <Box
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 600,
          background: isAdmin ? '#ede9fe' : '#f1f5f9',
          color: isAdmin ? '#7c3aed' : '#475569',
        }}
      >
        {isAdmin ? 'Администратор' : 'Пользователь'}
      </Box>
    </Box>
  );
}

function getInitials(str) {
  if (!str || str === '—') return '?';
  if (str.includes('@')) return str[0].toUpperCase();
  return str
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(raw) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(raw));
  } catch {
    return String(raw);
  }
}
