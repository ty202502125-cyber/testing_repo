import { useState } from 'react';
import Glyph from '../components/Glyph';
import { Button, Badge, EmptyState, PageIntro } from '../components/ui';
import { availability, dateLabel, timeRange, statusTone } from '../utils/format';
import { activityService, store } from '../services/api';

export default function AdminActivityManager({ notify }) {
  const [activities, setActivities] = useState(() => store.read('campus_activities', []));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [campaignImage, setCampaignImage] = useState('');

  const sync = () => setActivities(store.read('campus_activities', []));

  function chooseCampaignImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Choose an image file for the campaign picture.');
      event.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify('Choose an image smaller than 8 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1600 / image.width, 1200 / image.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setCampaignImage(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.onerror = () => notify('This image could not be opened. Try another file.');
      image.src = reader.result;
    };
    reader.onerror = () => notify('This image could not be read. Try another file.');
    reader.readAsDataURL(file);
  }

  async function save(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (!data.startTime || !data.endTime || data.endTime <= data.startTime) {
      notify('Choose an end time that is later than the start time.');
      return;
    }
    setBusy(true);
    const payload = {
      title: data.title,
      category: data.category,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      capacity: Number(data.capacity),
      description: data.description,
      status: data.status,
      campaignImage,
      organizer: 'Community Outreach Office',
    };
    try {
      if (editing) await activityService.update(editing.id, payload);
      else await activityService.create(payload);
      sync();
      setOpen(false);
      notify(editing ? 'Activity details updated.' : 'Activity published.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (window.confirm(`Delete "${item.title}"?`)) {
      await activityService.delete(item.id);
      sync();
      notify('Activity removed.');
    }
  }

  async function cancel(item) {
    const reason = window.prompt('Enter a cancellation reason (optional).');
    if (reason === null) return;
    if (!window.confirm('Cancel this event? New registrations will be disabled.')) return;
    await activityService.cancel(item.id, reason.trim());
    sync();
    notify('Event cancelled.');
  }

  function edit(item) {
    setEditing(item);
    setCampaignImage(item.campaignImage || '');
    setOpen(true);
  }

  const openCount = activities.filter((activity) => activity.status === 'open').length;

  return (
    <div className="content-wrap">
      <PageIntro
        title="Manage activities"
        text="Create opportunities, keep details and dates accurate, and make it easy for students to show up."
        action={<Button onClick={() => { setEditing(null); setCampaignImage(''); setOpen(true); }}>New activity</Button>}
      />

      <div className="manager-summary">
        <span className="manager-icon"><Glyph name="manage" size={18} /></span>
        <div>
          <b>{activities.length} activities</b>
          <small>{openCount} open for sign-up · {activities.filter((item) => item.status === 'completed').length} completed</small>
        </div>
      </div>

      <section className="records-panel manager-panel">
        <div className="section-heading"><div><h2>All activities</h2></div></div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Activity</th>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Places</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.title}</b><small>{item.location}</small></td>
                  <td>{dateLabel(item.date)}</td>
                  <td>{timeRange(item.startTime, item.endTime)}</td>
                  <td><b>{item.spotsAvailable}</b> / {item.capacity}</td>
                  <td><Badge tone={statusTone[item.status] || 'neutral'}>{availability(item).label === 'Full' ? 'Full' : item.status}</Badge></td>
                  <td>
                    <div className="row-actions">
                      <button className="edit-btn" onClick={() => edit(item)}>Edit</button>
                      {item.status !== 'cancelled' && item.status !== 'completed' ? (
                        <button className="reject-btn" onClick={() => cancel(item)}>Cancel event</button>
                      ) : null}
                      <button className="danger-btn" onClick={() => remove(item)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!activities.length ? <EmptyState message="No activities yet. Create the first opportunity." /> : null}
        </div>
      </section>

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={editing ? 'Edit activity' : 'New activity'} onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <form className="activity-modal" onSubmit={save}>
            <div className="modal-heading">
              <div><h2>{editing ? 'Edit activity' : 'New activity'}</h2></div>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close dialog"><Glyph name="close" size={16} /></button>
            </div>
            <label>Activity title<input name="title" defaultValue={editing?.title} placeholder="e.g. Saturday garden cleanup" required /></label>
            <div className="form-row">
              <label>
                Category
                <select name="category" defaultValue={editing?.category || 'Environment'}>
                  <option>Environment</option>
                  <option>Campus Care</option>
                  <option>Tutoring</option>
                  <option>Community</option>
                </select>
              </label>
              <label>
                Activity status
                <select name="status" defaultValue={editing?.status || 'open'}>
                  <option value="open">Open</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>Date<input type="date" name="date" defaultValue={editing?.date} required /></label>
              <label>Max attendees<input type="number" name="capacity" min="1" defaultValue={editing?.capacity || 20} required /></label>
            </div>
            <div className="form-row">
              <label>Start time<input type="time" name="startTime" defaultValue={editing?.startTime || '09:00'} required /></label>
              <label>End time<input type="time" name="endTime" defaultValue={editing?.endTime || '12:00'} required /></label>
            </div>
            <label className="campaign-upload-label">
              Campaign picture
              <input type="file" accept="image/*" onChange={chooseCampaignImage} />
              <small>Optional. Up to 8 MB. Activities without a picture simply show their date and details.</small>
            </label>
            {campaignImage ? (
              <div className="campaign-image-preview">
                <img src={campaignImage} alt="Campaign picture preview" />
                <button type="button" className="text-action" onClick={() => setCampaignImage('')}>Remove picture</button>
              </div>
            ) : null}
            <label>Location<input name="location" defaultValue={editing?.location} placeholder="Building, room, or meeting point" required /></label>
            <label>What will volunteers do?<textarea name="description" defaultValue={editing?.description} rows="3" placeholder="Give students a feel for what to expect…" required /></label>
            <div className="modal-actions">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish activity'}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
