import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { FaEdit, FaTrashAlt, FaExclamationTriangle, FaFileExport } from 'react-icons/fa';
import './WorkoutLog.css';

const WorkoutLog = ({ initialWeek = null, onWeekChange = null }) => {
  const { currentUser } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState([
    { name: '', sets: [{ weight: '', reps: '' }] }
  ]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editLogId, setEditLogId] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, logId: null });
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const totalWeeks = 9;
  
  // Set initial week from prop if provided
  useEffect(() => {
    if (initialWeek !== null && initialWeek !== undefined) {
      setCurrentWeek(initialWeek);
      // Notify parent that week has been changed
      if (onWeekChange) {
        onWeekChange(initialWeek);
      }
    }
  }, [initialWeek]);
  
  // Fungsi untuk mendapatkan hari dari tanggal
  const getDayFromDate = (dateString) => {
    const date = new Date(dateString);
    const dayIndex = date.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    // Konversi ke format kita (1 = Senin, 7 = Minggu)
    return dayIndex === 0 ? 7 : dayIndex;
  };
  
  const getWeekLabel = (weekNum) => {
    if (weekNum === 0) return 'Pre-Test';
    if (weekNum === 9) return 'Post-Test';
    return `Minggu ${weekNum}`;
  };

  const getWeekCategory = (weekNum) => {
    if (weekNum === 0) return { label: 'Pre-Test', category: 'Testing Phase', color: '#4CAF50' };
    if (weekNum === 9) return { label: 'Post-Test', category: 'Testing Phase', color: '#4CAF50' };
    if (weekNum >= 1 && weekNum <= 3) return { label: `Minggu ${weekNum}`, category: 'Hypertrophy', color: '#2196F3' };
    if (weekNum === 4) return { label: 'Minggu 4', category: 'Deload', color: '#FFC107' };
    if (weekNum >= 5 && weekNum <= 7) return { label: `Minggu ${weekNum}`, category: 'Strength', color: '#F44336' };
    if (weekNum === 8) return { label: 'Minggu 8', category: 'Deload', color: '#FFC107' };
    return { label: '', category: '', color: '#999' };
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Export workout to CSV
  const exportWorkoutToCSV = async () => {
    setShowExportConfirm(true);
  };

  const handleConfirmExport = async () => {
    setShowExportConfirm(false);

    try {
      // Fetch all workout logs for the current user
      const logsQuery = query(
        collection(db, 'workoutLogs'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      const allLogs = [];
      querySnapshot.forEach((doc) => {
        allLogs.push({ id: doc.id, ...doc.data() });
      });

      if (allLogs.length === 0) {
        showNotification('Tidak ada data workout untuk diexport', 'warning');
        return;
      }

      // Sort by week and day
      allLogs.sort((a, b) => {
        if (a.week !== b.week) return a.week - b.week;
        return a.day - b.day;
      });

      // Create CSV content
      let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      csvContent += 'Minggu,Hari,Tanggal,Latihan,Set,Berat (kg),Reps,Volume (kg)\n';

      allLogs.forEach(log => {
        const weekLabel = getWeekLabel(log.week);
        const dayName = days[log.day - 1];
        
        // Format workoutDate (stored as YYYY-MM-DD string) to DD/MM/YYYY
        let date = '-';
        if (log.workoutDate && typeof log.workoutDate === 'string') {
          const parts = log.workoutDate.split('-');
          if (parts.length === 3) {
            const [year, month, day] = parts;
            date = `${day}/${month}/${year}`;
          }
        }

        log.exercises.forEach(exercise => {
          exercise.sets.forEach((set, index) => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            const volume = weight * reps;
            
            csvContent += `"${weekLabel}","${dayName}","${date}","${exercise.name}",${index + 1},${weight},${reps},${volume}\n`;
          });
        });
      });

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const userName = currentUser.displayName || currentUser.email.split('@')[0];
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `Workout_Log_${userName}_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('Workout log berhasil diexport!', 'success');
    } catch (error) {
      console.error('Error exporting workout:', error);
      showNotification('Gagal mengexport workout log', 'error');
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchWorkoutLogs();
    }
  }, [currentUser, currentWeek]);

  const fetchWorkoutLogs = async () => {
    try {
      const logsQuery = query(
        collection(db, 'workoutLogs'),
        where('userId', '==', currentUser.uid),
        where('week', '==', currentWeek)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      // Sort by day client-side
      logs.sort((a, b) => a.day - b.day);
      setWorkoutLogs(logs);
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    }
  };

  const calculateVolume = (sets) => {
    return sets.reduce((total, set) => {
      const weight = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps) || 0;
      return total + (weight * reps);
    }, 0);
  };

  const addSet = (exerciseIndex) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.push({ weight: '', reps: '' });
    setExercises(newExercises);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const newExercises = [...exercises];
    if (newExercises[exerciseIndex].sets.length > 1) {
      newExercises[exerciseIndex].sets.splice(setIndex, 1);
      setExercises(newExercises);
    }
  };

  const addExercise = () => {
    if (exercises.length < 7) {
      if (newExerciseName.trim()) {
        setExercises([...exercises, { name: newExerciseName.trim(), sets: [{ weight: '', reps: '' }] }]);
        setNewExerciseName('');
        setShowExerciseModal(false);
      }
    }
  };

  const openExerciseModal = () => {
    setShowExerciseModal(true);
    setNewExerciseName('');
  };

  const removeExercise = (index) => {
    if (exercises.length > 1) {
      const newExercises = exercises.filter((_, i) => i !== index);
      setExercises(newExercises);
    }
  };

  const updateExercise = (exerciseIndex, field, value) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex][field] = value;
    setExercises(newExercises);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(newExercises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!exercises.some(ex => ex.name.trim())) {
      alert('Minimal satu exercise harus diisi');
      return;
    }

    try {
      setLoading(true);

      // Calculate total volume
      const totalVolume = exercises.reduce((total, exercise) => {
        return total + calculateVolume(exercise.sets);
      }, 0);

      const dayFromDate = getDayFromDate(workoutDate);
      
      const workoutData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        weekNumber: currentWeek,
        week: currentWeek,
        day: dayFromDate,
        dayName: days[dayFromDate - 1],
        workoutDate: workoutDate,
        exercises: exercises.filter(ex => ex.name.trim()),
        totalVolume: totalVolume,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'workoutLogs'), workoutData);
      
      // Reset form
      setExercises([{ name: '', sets: [{ weight: '', reps: '' }] }]);
      setWorkoutDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      setShowWorkoutModal(false);
      fetchWorkoutLogs();
      showNotification('Workout log berhasil disimpan!', 'success');
    } catch (error) {
      console.error('Error saving workout log:', error);
      showNotification('Gagal menyimpan workout log', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setEditMode(true);
    setEditLogId(log.id);
    setWorkoutDate(log.workoutDate || new Date().toISOString().split('T')[0]);
    setExercises(log.exercises);
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!exercises.some(ex => ex.name.trim())) {
      alert('Minimal satu exercise harus diisi');
      return;
    }

    setLoading(true);
    try {
      const validExercises = exercises.filter(ex => ex.name.trim());
      
      // Calculate total volume correctly
      const totalVolume = validExercises.reduce((total, exercise) => {
        return total + calculateVolume(exercise.sets);
      }, 0);

      const dayFromDate = getDayFromDate(workoutDate);

      await updateDoc(doc(db, 'workoutLogs', editLogId), {
        day: dayFromDate,
        dayName: days[dayFromDate - 1],
        workoutDate: workoutDate,
        exercises: validExercises,
        totalVolume: totalVolume,
        updatedAt: new Date().toISOString()
      });

      setExercises([{ name: '', sets: [{ weight: '', reps: '' }] }]);
      setWorkoutDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      setShowWorkoutModal(false);
      setEditMode(false);
      setEditLogId(null);
      fetchWorkoutLogs();
      showNotification('Workout log berhasil diupdate!', 'success');
    } catch (error) {
      console.error('Error updating workout log:', error);
      showNotification('Gagal mengupdate workout log', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditLogId(null);
    setExercises([{ name: '', sets: [{ weight: '', reps: '' }] }]);
    setShowForm(false);
  };

  const deleteWorkoutLog = async (logId) => {
    setDeleteConfirm({ show: true, logId });
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'workoutLogs', deleteConfirm.logId));
      fetchWorkoutLogs();
      showNotification('Workout log berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting workout log:', error);
      showNotification('Gagal menghapus workout log', 'error');
    } finally {
      setDeleteConfirm({ show: false, logId: null });
    }
  };

  const getDayLog = (day) => {
    return workoutLogs.find(log => log.day === day);
  };

  return (
    <div className="workout-log-container">
      {/* Notification Popup */}
      {notification.show && (
        <div className={`notification-popup ${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="workout-header">
        <h2>Workout Log - Program 8 Minggu</h2>
        <div className="workout-header-actions">
          <button 
            className="export-workout-btn"
            onClick={exportWorkoutToCSV}
            title="Export Workout ke Spreadsheet"
          >
            <FaFileExport /> Export Workout
          </button>
          <button 
            className="add-workout-btn"
            onClick={() => {
              if (showForm && showWorkoutModal) {
                setShowWorkoutModal(false);
                setShowForm(false);
                setEditMode(false);
              } else {
                setShowWorkoutModal(true);
                setShowForm(true);
                setEditMode(false);
              }
            }}
          >
            {showForm ? '✕ Tutup' : '+ Tambah Workout'}
          </button>
        </div>
      </div>

      {/* Week Selector */}
      <div className="week-selector">
        <label htmlFor="week-dropdown" className="week-label">Pilih Minggu:</label>
        <select 
          id="week-dropdown"
          value={currentWeek} 
          onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
          className="week-dropdown"
        >
          <option value={0}>Pre-Test</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(week => (
            <option key={week} value={week}>Minggu {week}</option>
          ))}
          <option value={9}>Post-Test</option>
        </select>
        <div className="week-current-display">
          <div className="week-current-label">{getWeekCategory(currentWeek).label}</div>
          <div className="week-current-category" style={{color: getWeekCategory(currentWeek).color}}>
            {getWeekCategory(currentWeek).category}
          </div>
        </div>
      </div>

      {/* Add/Edit Workout Form Modal */}
      {showForm && showWorkoutModal && (
        <div className="workout-modal-overlay" onClick={() => {
          setShowWorkoutModal(false);
          setShowForm(false);
          setEditMode(false);
        }}>
          <div className="workout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workout-modal-header">
              <h3>{editMode ? `Edit Workout - ${getWeekLabel(currentWeek)} - ${days[getDayFromDate(workoutDate) - 1]}` : `Tambah Workout - ${getWeekLabel(currentWeek)} - ${days[getDayFromDate(workoutDate) - 1]}`}</h3>
              <button 
                className="workout-modal-close"
                onClick={() => {
                  setShowWorkoutModal(false);
                  setShowForm(false);
                  setEditMode(false);
                }}
              >
                ✕
              </button>
            </div>
            <div className="workout-form-card">
              <form onSubmit={editMode ? handleUpdate : handleSubmit}>
                {/* Date Input */}
                <div className="form-group">
                  <label>Tanggal Workout</label>
                  <input 
                    type="date" 
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                    className="date-input"
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Display day from selected date */}
                <div className="form-group">
                  <label>Hari</label>
                  <input
                    type="text"
                    value={days[getDayFromDate(workoutDate) - 1]}
                    className="day-display"
                    disabled
                    style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                  />
                </div>

                {/* Exercises */}
                <div className="exercises-container">
                  {exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="exercise-block">
                      <div className="exercise-header">
                    <input
                      type="text"
                      placeholder="Nama Exercise"
                      value={exercise.name}
                      onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                      className="exercise-name-input"
                      required
                    />
                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExercise(exerciseIndex)}
                        className="remove-exercise-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Sets */}
                  <div className="sets-container">
                    <div className="sets-header">
                      <span>Set</span>
                      <span>Weight (kg)</span>
                      <span>Reps</span>
                      <span>Volume</span>
                      <span></span>
                    </div>
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="set-row">
                        <span className="set-number">{setIndex + 1}</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={set.weight}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                          className="set-input"
                          min="0"
                          step="0.01"
                        />
                        <input
                          type="number"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                          className="set-input"
                          min="0"
                        />
                        <span className="volume-display">
                          {((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSet(exerciseIndex, setIndex)}
                          className="remove-set-btn"
                          disabled={exercise.sets.length === 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addSet(exerciseIndex)}
                    className="add-set-btn"
                  >
                    + Tambah Set
                  </button>

                      <div className="exercise-volume">
                        Total Volume: <strong>{calculateVolume(exercise.sets).toFixed(2)} kg</strong>
                      </div>
                    </div>
                  ))}
                </div>

                {exercises.length < 7 && (
                  <button
                    type="button"
                    onClick={openExerciseModal}
                    className="add-exercise-btn"
                  >
                    + Tambah Exercise
                  </button>
                )}

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (editMode ? 'Mengupdate...' : 'Menyimpan...') : (editMode ? 'Update Workout' : 'Simpan Workout')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (editMode) {
                        handleCancelEdit();
                      }
                      setShowWorkoutModal(false);
                      setShowForm(false);
                      setEditMode(false);
                    }} 
                    className="cancel-btn"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Overview */}
      <div className="week-overview">
        <h3>Overview {getWeekLabel(currentWeek)}</h3>
        <div className="days-grid">
          {days.map((day, index) => {
            const dayLog = getDayLog(index + 1);
            return (
              <div 
                key={index} 
                className={`day-card ${dayLog ? 'has-log' : 'no-log'}`}
              >
                <div className="day-name">{day}</div>
                {dayLog ? (
                  <>
                    <div className="day-exercises">
                      {dayLog.exercises.length} exercise{dayLog.exercises.length > 1 ? 's' : ''}
                    </div>
                    <div className="day-volume">
                      Volume: {dayLog.totalVolume.toFixed(2)} kg
                    </div>
                    <button
                      onClick={() => deleteWorkoutLog(dayLog.id)}
                      className="delete-day-btn"
                    >
                      Hapus
                    </button>
                  </>
                ) : (
                  <div className="no-workout">Belum ada workout</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Logs */}
      {workoutLogs.length > 0 && (
        <div className="detailed-logs">
          <h3>Detail Workout {getWeekLabel(currentWeek)}</h3>
          {workoutLogs.map((log) => (
            <div key={log.id} className="log-detail-card">
              <div className="log-header">
                <div>
                  <h4>{log.dayName}</h4>
                  <span className="log-date">
                    {log.workoutDate ? new Date(log.workoutDate + 'T00:00:00').toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : new Date(log.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="log-actions">
                  <button 
                    onClick={() => {
                      handleEdit(log);
                      setShowWorkoutModal(true);
                    }}
                    className="btn-edit-log"
                    title="Edit Workout"
                  >
                    <FaEdit style={{marginRight: '6px'}} /> Edit
                  </button>
                  <button 
                    onClick={() => deleteWorkoutLog(log.id)}
                    className="btn-delete-log"
                    title="Hapus Workout"
                  >
                    <FaTrashAlt style={{marginRight: '6px'}} /> Hapus
                  </button>
                </div>
              </div>
              {log.exercises.map((exercise, idx) => (
                <div key={idx} className="exercise-detail">
                  <h5>{exercise.name}</h5>
                  <div className="table-wrapper">
                    <table className="sets-table">
                      <thead>
                        <tr>
                          <th>Set</th>
                          <th>Weight (kg)</th>
                          <th>Reps</th>
                          <th>Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIdx) => (
                          <tr key={setIdx}>
                            <td>{setIdx + 1}</td>
                            <td>{set.weight}</td>
                            <td>{set.reps}</td>
                            <td>{(parseFloat(set.weight) * parseInt(set.reps)).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="3"><strong>Total Volume</strong></td>
                          <td><strong>{calculateVolume(exercise.sets).toFixed(2)} kg</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <div className="log-total-volume">
                <strong>Total Volume Hari Ini: {log.totalVolume.toFixed(2)} kg</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Modal */}
      {showExerciseModal && (
        <div className="exercise-modal-overlay" onClick={() => setShowExerciseModal(false)}>
          <div className="exercise-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Exercise Baru</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowExerciseModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <label>Nama Exercise:</label>
              <input
                type="text"
                placeholder="Contoh: Bench Press, Squat, Deadlift..."
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newExerciseName.trim()) {
                    addExercise();
                  }
                }}
                className="exercise-modal-input"
                autoFocus
              />
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-cancel-btn"
                onClick={() => setShowExerciseModal(false)}
              >
                Batal
              </button>
              <button 
                className="modal-add-btn"
                onClick={addExercise}
                disabled={!newExerciseName.trim()}
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="delete-modal-overlay" onClick={() => setDeleteConfirm({ show: false, logId: null })}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <FaTrashAlt style={{fontSize: '24px', opacity: 0.95}} />
              <h3>Konfirmasi Hapus</h3>
            </div>
            
            <div className="delete-modal-body">
              <div className="delete-icon"><FaExclamationTriangle /></div>
              <p>Apakah Anda yakin ingin menghapus workout log ini?</p>
              <p className="delete-warning">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            
            <div className="delete-modal-footer">
              <button 
                className="delete-cancel-btn"
                onClick={() => setDeleteConfirm({ show: false, logId: null })}
              >
                Batal
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={confirmDelete}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div className="delete-modal-overlay" onClick={() => setShowExportConfirm(false)}>
          <div className="delete-modal export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header export-header">
              <FaFileExport style={{fontSize: '24px', opacity: 0.95}} />
              <h3>Export Workout Log</h3>
            </div>
            
            <div className="delete-modal-body">
              <div className="export-icon"><FaFileExport /></div>
              <p>Apakah Anda yakin ingin mengunduh file Workout Log dalam format CSV?</p>
              <p className="export-info">File akan berisi semua data latihan Anda dari semua minggu.</p>
            </div>
            
            <div className="delete-modal-footer">
              <button 
                className="delete-cancel-btn"
                onClick={() => setShowExportConfirm(false)}
              >
                Batal
              </button>
              <button 
                className="export-confirm-btn"
                onClick={handleConfirmExport}
              >
                Ya, Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLog;
