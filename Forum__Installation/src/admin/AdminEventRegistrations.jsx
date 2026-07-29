import React, { useState, useEffect } from "react";
import { Search, Download, Trash2, CheckCircle, XCircle } from "lucide-react";
import * as XLSX from 'xlsx';

export default function AdminEventRegistrations() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    } else {
      setRegistrations([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchRegistrations = async (eventId) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/api/events/${eventId}/team-registrations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      } else {
        console.error("Failed to fetch registrations");
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (regId) => {
    if (!window.confirm("Are you sure you want to delete this registration?")) return;
    try {
      const response = await fetch(`${apiUrl}/admin/api/team-registrations/${regId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        fetchRegistrations(selectedEventId);
        fetchEvents(); // update seat counts
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const exportToExcel = () => {
    if (registrations.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(registrations.map(r => ({
      'Reg ID': r.registration_id,
      'Team Name': r.team_name,
      'Leader Name': r.leader_name,
      'Leader Email': r.leader_email,
      'Leader Phone': r.leader_phone,
      'Leader Year': r.leader_year,
      'Leader Branch': r.leader_branch,
      'Member 2 Name': r.member2_name,
      'Member 2 Email': r.member2_email,
      'Member 2 Phone': r.member2_phone,
      'Member 2 Year': r.member2_year,
      'Registration Date': new Date(r.created_at).toLocaleString()
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, `Event_${selectedEventId}_Registrations.xlsx`);
  };

  const filteredRegs = registrations.filter(r => 
    r.team_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.leader_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.registration_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.leader_email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedEvent = events.find(e => e.id.toString() === selectedEventId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Registrations</h1>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="">Select Event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
            
            {selectedEvent && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedEvent.registered_teams_count >= selectedEvent.max_teams ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                {selectedEvent.registered_teams_count} / {selectedEvent.max_teams} Teams
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member 2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : filteredRegs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                filteredRegs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                      {reg.registration_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reg.team_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{reg.leader_name}</div>
                      <div className="text-sm text-gray-500">{reg.leader_email}</div>
                      <div className="text-xs text-gray-400">{reg.leader_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reg.member2_name}</div>
                      <div className="text-sm text-gray-500">{reg.member2_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(reg.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
