/* TAD-PAK design system — component barrel.
   Render inside an element with class `tad` (see src/styles/tad.css). */
export { Button, IconButton } from './actions';
export type { ButtonProps, ButtonVariant, ButtonSize, IconButtonProps, IconButtonVariant } from './actions';

export { Input, Select, Switch, OTPInput } from './forms';
export type { InputProps, SelectProps, SelectOption, SwitchProps, OTPInputProps } from './forms';

export { Badge, StatusDot, Tag } from './feedback';
export type { BadgeProps, BadgeVariant, StatusDotProps, DeviceStatus, TagProps } from './feedback';

export { Card, Metric } from './data';
export type { CardProps, MetricProps, MetricTrend } from './data';

export { Tabs } from './navigation';
export type { TabsProps, TabItem } from './navigation';

export { MapMarker, MarkerSizeForDensity } from './map';
export type { MapMarkerProps, MarkerShape, MarkerKind, MarkerStatus } from './map';
