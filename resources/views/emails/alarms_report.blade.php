<!DOCTYPE html>
<h1>hello, {{ $user->name }}</h1>
<p>there are new alarms in your nodes:</p>

<table border="1" cellpadding="10" style="border-collapse: collapse;">
    <thead>
        <tr style="background: #f4f4f4;">
            <th>Node (MAC)</th>
            <th>Type</th>
            <th>Message</th>
            <th>Date/Time</th>
        </tr>
    </thead>
    <tbody>
        @foreach($alarms as $alarm)
            <tr>
                <td>{{ $alarm->node->mac_address }}</td>
                <td>
                    <strong>{{ $alarm->type === 'vbat_low' ? 'Low Battery' : 'Fire Risk' }}</strong>
                </td>
                <td>{{ $alarm->message }}</td>
                <td>{{ $alarm->created_at->format('d/m/Y H:i') }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<p>Please, check the control panel for more details.</p>