import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const metadata: Metadata = { title: 'Sensor Registry – TAD101 | Track Any Device' };

type Sensor = { slug: string; name: string; label?: string; data_type: string; unit?: string; description?: string };

const sensors: Sensor[] = [
    { slug: 'lat',         name: 'Latitude',          data_type: 'float',   unit: '°',   description: 'WGS-84 latitude' },
    { slug: 'lng',         name: 'Longitude',         data_type: 'float',   unit: '°',   description: 'WGS-84 longitude' },
    { slug: 'alt',         name: 'Altitude',          data_type: 'float',   unit: 'm',   description: 'Meters above sea level' },
    { slug: 'speed',       name: 'Speed',             data_type: 'float',   unit: 'km/h' },
    { slug: 'direction',   name: 'Heading',           data_type: 'float',   unit: '°',   description: 'Compass bearing 0–360' },
    { slug: 'battery_pct', name: 'Battery %',         data_type: 'integer', unit: '%' },
    { slug: 'battery_mv',  name: 'Battery voltage',   data_type: 'integer', unit: 'mV' },
    { slug: 'gsm_signal',  name: 'GSM signal',        data_type: 'integer', unit: 'dBm' },
    { slug: 'hdop',        name: 'HDOP',              data_type: 'float',   description: 'Horizontal dilution of precision' },
    { slug: 'temperature', name: 'Temperature',       data_type: 'float',   unit: '°C' },
    { slug: 'mcc',         name: 'Mobile Country Code', data_type: 'string' },
    { slug: 'mnc',         name: 'Mobile Network Code', data_type: 'string' },
    { slug: 'lac',         name: 'Location Area Code',  data_type: 'integer' },
    { slug: 'cell_id',     name: 'Cell ID',             data_type: 'integer' },
];

export default function SensorsPage() {
    return (
        <>
<p>
                TAD101 carries a uniform sensor surface — every device populates
                the fields it has and leaves the rest null. The platform never
                assumes a sensor is present.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Slug</th>
                        <th>Label</th>
                        <th>Type</th>
                        <th>Unit</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {sensors.map((s) => (
                        <tr key={s.slug}>
                            <td>
                                <code>{s.slug}</code>
                            </td>
                            <td>{s.label || s.name}</td>
                            <td>
                                <code>{s.data_type}</code>
                            </td>
                            <td>{s.unit || '—'}</td>
                            <td>{s.description || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p className="text-sm text-neutral-500">
                Adding a sensor? See RULE DOC-2 in CLAUDE.md — every new sensor
                slug must appear here, in the signals schema, and in the
                relevant device-type sensor pivot.
            </p>
        </>
    );
}
