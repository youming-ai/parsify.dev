/**
 * IP Lookup Page
 * Get detailed information about IP addresses including location and ISP data
 */

import { IP } from '@/components/tools/network/ip-lookup';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'IP Lookup - Free IP Address Information | Parsify.dev',
	description:
		'Lookup detailed information about IP addresses including location and ISP data. Supports IPv4 and IPv6 addresses. Free geolocation API integration.',
	keywords: [
		'ip lookup',
		'ip address lookup',
		'ip geolocation',
		'ip api',
		'network utility',
		'ip geolocator',
		'ip database',
		'ip geolocator',
	],
};

export default function IPLookupPage() {
	return (
		<ToolPageWrapper
			title="IP Lookup"
			description="Get detailed information about IP addresses including location and ISP data"
			toolId="ip-lookup"
		>
			<IPLookup />
		</ToolPageWrapper>
	);
}
