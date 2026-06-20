import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '300px', width: '100%', borderRadius: '10px', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
      Memuat Peta...
    </div>
  )
});

export default MapPicker;
