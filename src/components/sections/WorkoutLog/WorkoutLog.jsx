import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import './WorkoutLog.css';

const WorkoutLog = () => {
  const { currentUser } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState([
    { name: '', sets: [{ weight: '', reps: '' }] }
  ]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editLogId, setEditLogId] = useState(null);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const totalWeeks = 8;

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
      setExercises([...exercises, { name: '', sets: [{ weight: '', reps: '' }] }]);
    }
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

      const workoutData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        week: currentWeek,
        day: selectedDay,
        dayName: days[selectedDay - 1],
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
      fetchWorkoutLogs();
      alert('Workout log berhasil disimpan!');
    } catch (error) {
      console.error('Error saving workout log:', error);
      alert('Gagal menyimpan workout log');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setEditMode(true);
    setEditLogId(log.id);
    setSelectedDay(log.day);
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
      const totalVolume = calculateVolume(validExercises);

      await updateDoc(doc(db, 'workoutLogs', editLogId), {
        workoutDate: workoutDate,
        exercises: validExercises,
        totalVolume: totalVolume,
        updatedAt: new Date().toISOString()
      });

      setExercises([{ name: '', sets: [{ weight: '', reps: '' }] }]);
      setWorkoutDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      setEditMode(false);
      setEditLogId(null);
      fetchWorkoutLogs();
      alert('Workout log berhasil diupdate!');
    } catch (error) {
      console.error('Error updating workout log:', error);
      alert('Gagal mengupdate workout log');
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
    if (window.confirm('Hapus workout log ini?')) {
      try {
        await deleteDoc(doc(db, 'workoutLogs', logId));
        fetchWorkoutLogs();
        alert('Workout log berhasil dihapus');
      } catch (error) {
        console.error('Error deleting workout log:', error);
        alert('Gagal menghapus workout log');
      }
    }
  };

  const getDayLog = (day) => {
    return workoutLogs.find(log => log.day === day);
  };

  return (
    <div className="workout-log-container">
      <div className="workout-header">
        <h2>Workout Log - Program 8 Minggu</h2>
        <button 
          className="add-workout-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Tutup' : '+ Tambah Workout'}
        </button>
      </div>

      {/* Week Selector */}
      <div className="week-selector">
        <button 
          onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
          disabled={currentWeek === 1}
          className="week-nav-btn"
        >
          ← Minggu Sebelumnya
        </button>
        <span className="week-display">Minggu {currentWeek} dari {totalWeeks}</span>
        <button 
          onClick={() => setCurrentWeek(prev => Math.min(totalWeeks, prev + 1))}
          disabled={currentWeek === totalWeeks}
          className="week-nav-btn"
        >
          Minggu Selanjutnya →
        </button>
      </div>

      {/* Add/Edit Workout Form */}
      {showForm && (
        <div className="workout-form-card">
          <h3>{editMode ? `Edit Workout - Minggu ${currentWeek} - ${days[selectedDay - 1]}` : `Tambah Workout - Minggu ${currentWeek}`}</h3>
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

            {/* Day Selector */}
            {!editMode && (
            <div className="form-group">
              <label>Pilih Hari</label>
              <select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="day-select"
              >
                {days.map((day, index) => (
                  <option key={index} value={index + 1}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            )}

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
                          step="0.5"
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
                          {((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)).toFixed(1)}
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
                    Total Volume: <strong>{calculateVolume(exercise.sets).toFixed(1)} kg</strong>
                  </div>
                </div>
              ))}
            </div>

            {exercises.length < 7 && (
              <button
                type="button"
                onClick={addExercise}
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
                onClick={editMode ? handleCancelEdit : () => setShowForm(false)} 
                className="cancel-btn"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly Overview */}
      <div className="week-overview">
        <h3>Overview Minggu {currentWeek}</h3>
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
                      Volume: {dayLog.totalVolume.toFixed(1)} kg
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
          <h3>Detail Workout Minggu {currentWeek}</h3>
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
                    onClick={() => handleEdit(log)}
                    className="btn-edit-log"
                    title="Edit Workout"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => deleteWorkoutLog(log.id)}
                    className="btn-delete-log"
                    title="Hapus Workout"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
              {log.exercises.map((exercise, idx) => (
                <div key={idx} className="exercise-detail">
                  <h5>{exercise.name}</h5>
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
                          <td>{(parseFloat(set.weight) * parseInt(set.reps)).toFixed(1)}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan="3"><strong>Total Volume</strong></td>
                        <td><strong>{calculateVolume(exercise.sets).toFixed(1)} kg</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="log-total-volume">
                <strong>Total Volume Hari Ini: {log.totalVolume.toFixed(1)} kg</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutLog;
