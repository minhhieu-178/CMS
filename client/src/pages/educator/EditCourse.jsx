import React, { useContext, useEffect, useRef, useState } from 'react'
import Quill from 'quill';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { useAuth, useUser } from '@clerk/clerk-react';
import { updateCourse, getCourseDetails } from '../../utils/api';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import ImprovedLoading from '../../components/students/ImprovedLoading';

// Simple unique ID generator for browser
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const EditCourse = () => {

  const { courseId } = useParams();
  const quillRef = useRef(null);
  const editorRef = useRef(null);
  const { navigate } = useContext(AppContext);
  const { getToken } = useAuth();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)
  const [existingThumbnail, setExistingThumbnail] = useState('')
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lectureDetails, setLectureDetails] = useState(
    {
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    }
  )

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      let loadedCourse = null;
      
      // Try to load from localStorage first
      if (user) {
        const storageKey = `educatorCourses_${user.id}`;
        const storedCourses = localStorage.getItem(storageKey);
        
        if (storedCourses) {
          const courses = JSON.parse(storedCourses);
          const course = courses.find(c => c._id === courseId);
          
          if (course) {
            loadedCourse = course;
          }
        }
      }
      
      // If not in localStorage, fetch from API
      if (!loadedCourse) {
        const result = await getCourseDetails(courseId);
        if (result.success) {
          loadedCourse = result.course;
        } else {
          toast.error('Failed to load course');
          navigate('/educator/my-courses');
          return;
        }
      }
      
      // Store course data in state
      if (loadedCourse) {
        console.log('💾 Setting courseData state:', loadedCourse.courseTitle);
        setCourseData(loadedCourse);
        populateCourseData(loadedCourse);
      } else {
        console.log('❌ No course data loaded');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
      navigate('/educator/my-courses');
    } finally {
      setLoading(false);
    }
  };

  const populateCourseData = (course) => {
    console.log('📚 Populating course data:', course.courseTitle);
    console.log('📝 Description:', course.courseDescription?.substring(0, 100));
    
    setCourseTitle(course.courseTitle || '');
    setCoursePrice(course.coursePrice || 0);
    setDiscount(course.discount || 0);
    setExistingThumbnail(course.courseThumbnail || '');
    setChapters(course.courseContent || []);
    
    // Description will be set by useEffect when quillRef is ready
  };

  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name:');
      if(title) {
        const newChapter = {
          chapterId: generateId(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === 'remove') {
      setChapters(chapters.filter((chapter)=> chapter.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter)=> 
          chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
        )
      );
    }
  };

  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === 'remove') {
      setChapters(
        chapters.map((chapter)=>{
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      );
    }
  };

  const addLecture = ()=>{
    setChapters(
      chapters.map((chapter)=>{
        if(chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
            lectureId: generateId()
          };
          chapter.chapterContent.push(newLecture);
        }
        return chapter;
      })
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!courseTitle.trim()) {
      toast.error('Please enter course title')
      return
    }
    
    if (!quillRef.current) {
      toast.error('Please enter course description')
      return
    }
    
    const courseDescription = quillRef.current.root.innerHTML
    if (!courseDescription || courseDescription === '<p><br></p>') {
      toast.error('Please enter course description')
      return
    }
    
    if (!coursePrice || coursePrice <= 0) {
      toast.error('Please enter valid course price')
      return
    }
    
    if (!image && !existingThumbnail) {
      toast.error('Please upload course thumbnail')
      return
    }
    
    if (chapters.length === 0) {
      toast.error('Please add at least one chapter')
      return
    }
    
    // Check if all chapters have lectures
    const emptyChapters = chapters.filter(ch => ch.chapterContent.length === 0)
    if (emptyChapters.length > 0) {
      toast.error('All chapters must have at least one lecture')
      return
    }
    
    try {
      setIsSubmitting(true)
      toast.info('Updating course...')
      
      const token = await getToken()
      
      if (!token) {
        toast.error('Please sign in to continue')
        return
      }
      
      // Prepare course data
      const courseData = {
        courseTitle,
        courseDescription,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
        isPublished: true
      }
      
      // If no new image, keep existing thumbnail
      if (!image && existingThumbnail) {
        courseData.courseThumbnail = existingThumbnail;
      }
      
      // Call API to update course
      const result = await updateCourse(token, courseId, courseData, image)
      
      if (result.success) {
        toast.success('Course updated successfully!')
        
        // Update localStorage
        if (user) {
          const storageKey = `educatorCourses_${user.id}`;
          const storedCourses = localStorage.getItem(storageKey);
          
          if (storedCourses) {
            let courses = JSON.parse(storedCourses);
            const index = courses.findIndex(c => c._id === courseId);
            
            if (index !== -1) {
              // Update the course in the array
              courses[index] = {
                ...courses[index],
                ...courseData,
                _id: courseId,
                courseThumbnail: image ? result.course?.courseThumbnail : existingThumbnail
              };
              
              localStorage.setItem(storageKey, JSON.stringify(courses));
              
              // Dispatch event to notify AppContext
              window.dispatchEvent(new Event('coursesUpdated'));
            }
          }
        }
        
        // Navigate to My Courses
        setTimeout(() => {
          navigate('/educator/my-courses')
        }, 1000)
      } else {
        toast.error(result.message || 'Failed to update course')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error('Failed to update course. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  };

  useEffect(()=>{
    // Initiate Quill only once, with a small delay to ensure DOM is ready
    const initQuill = () => {
      if (!quillRef.current && editorRef.current) {
        console.log('🎨 Initializing Quill editor');
        console.log('📦 Editor ref exists:', !!editorRef.current);
        
        quillRef.current = new Quill(editorRef.current, {
          theme: 'snow',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link'],
              ['clean']
            ]
          }
        });
        
        console.log('✅ Quill editor initialized');
        console.log('🔧 Quill is disabled?', quillRef.current.isEnabled() === false);
        
        // Explicitly enable if disabled
        if (!quillRef.current.isEnabled()) {
          console.log('⚠️ Quill was disabled, enabling now...');
          quillRef.current.enable();
        }
      }
    };
    
    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(initQuill, 50);
    return () => clearTimeout(timer);
  }, []) // Only run once on mount

  // Separate effect to populate description when courseData changes
  useEffect(() => {
    console.log('📊 courseData useEffect triggered');
    console.log('  - quillRef.current:', !!quillRef.current);
    console.log('  - courseData:', !!courseData);
    console.log('  - courseDescription:', courseData?.courseDescription?.substring(0, 50));
    
    if (quillRef.current && courseData && courseData.courseDescription) {
      console.log('🔄 Setting course description in Quill');
      console.log('📝 Description length:', courseData.courseDescription.length);
      console.log('🔧 Quill enabled?', quillRef.current.isEnabled());
      
      setTimeout(() => {
        try {
          quillRef.current.root.innerHTML = courseData.courseDescription;
          
          // Force enable after setting content
          if (!quillRef.current.isEnabled()) {
            console.log('⚠️ Re-enabling Quill after setting content');
            quillRef.current.enable();
          }
          
          console.log('✅ Description set successfully');
        } catch (error) {
          console.error('❌ Error setting description:', error);
        }
      }, 100);
    } else {
      console.log('⏸️ Waiting for Quill or courseData to be ready');
    }
  }, [courseData])

  if (loading) {
    return <ImprovedLoading />
  }

  return (
    <div className='h-screen overflow-scroll md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='flex gap-8 max-w-7xl mx-auto'>
        {/* Form Section */}
        <div className='w-full md:w-1/2'>
          <div className='mb-4'>
            <h1 className='text-3xl font-bold text-gray-800'>Edit Course</h1>
            <p className='text-gray-600'>Update your course information</p>
          </div>
          
          <form onSubmit={handleSubmit} 
          className='flex flex-col gap-4 text-gray-500'>
        <div className='flex flex-col gap-1'>
          <p>Course Title</p>
          <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle} type="text"
          placeholder='Type Here' className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500'
          required />
        </div>
        <div className='flex flex-col gap-1'>
          <p>Course Description</p>
          <div 
            ref={editorRef} 
            className='bg-white border border-gray-500 rounded' 
            style={{ 
              minHeight: '200px',
              pointerEvents: 'auto',
              cursor: 'text'
            }}
          ></div>
        </div>
        
        <div className='flex items-center justify-between flex-wrap'>
          <div className='flex flex-col gap-1'>
            <p>Course Price</p>
            <input onChange={e => setCoursePrice(e.target.value)} value={coursePrice} type="number"
            placeholder='0' className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500'
            required />
          </div>
        

          <div>
            <p>Course Thumbnail</p>
            <label htmlFor="thumbnailImage" className='flex items-center gap-3'>
              <img src={assets.file_upload_icon} alt='' className='p-3 bg-blue-500 rounded'/>
              <input type="file" id='thumbnailImage' onChange={e => setImage(e.target.files[0])}
              accept='image/*' hidden />
              {image ? (
                <img className='max-h-10' src={URL.createObjectURL(image)} alt="thumbnail preview" />
              ) : existingThumbnail ? (
                <img className='max-h-10' src={existingThumbnail} alt="current thumbnail" />
              ) : null}
            </label>
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <p>Discount %</p>
          <input onChange={e => setDiscount(e.target.value)} value={discount} type="number"
          placeholder='0' min={0} max={100}  className='outline-none md:py-2.5 py-2 w-28 px-3
          rounded border border-gray-500' required />
        </div>
        {/* Adding Chapters & Lectures */}
        <div>
          {chapters.map((chapter, chapterIndex) =>(
            <div key={chapterIndex} className='bg-white border rounded-lg mb-4'>
              <div className='flex justify-between items-center p-4 border-b'>
                <div className='flex items-center'>
                  <img onClick={()=> handleChapter('toggle', chapter.chapterId)} 
                  src={assets.dropdown_icon} width={14} alt="" className=
                  {`mr-2 cursor-pointer transition-all ${chapter.collapsed &&
                  "-rotate-90"}`}/>
                  <span className='font-semibold'>{chapterIndex + 1} {chapter.chapterTitle}</span>
                </div>
                <span className='text-gray-500'>{chapter.chapterContent.length}
                Lectures</span>
                <img onClick={()=> handleChapter('remove', chapter.chapterId)}
                src={assets.cross_icon} alt="" className='cursor-pointer' />
              </div>
              {!chapter.collapsed && (
                <div className='p-4'>
                  {chapter.chapterContent.map((lecture, lectureIndex)=>(
                    <div key={lectureIndex} className='flex justify-between
                    items-center mb-2'>
                      <span>{lectureIndex + 1} {lecture.lectureTitle} - {lecture.
                      lectureDuration} mins - <a href={lecture.lectureUrl}
                      target='_blank' className='text-blue-500'>Link</a> - {lecture.
                      isPreviewFree ? 'Free Preview' : 'Paid'}</span>
                      <img src={assets.cross_icon} alt="" onClick={()=> handleLecture
                      ('remove', chapter.chapterId, lectureIndex)} 
                      className='cursor-pointer'/>
                    </div>
                  ))}
                  <div className='inline-flex bg-gray-100 p-2 rounded
                  cursor-pointer mt-2' onClick={()=> handleLecture('add', chapter.
                  chapterId)}>+ Add Lecture</div>
                </div>
              )}
            </div>
          ))}
          <div className='flex justify-center items-center bg-blue-100 p-2 
          rounded-lg cursor-pointer' onClick={()=> handleChapter('add')}>+ Add Chapter</div>

          {showPopup && (
            <div className='fixed inset-0 flex items-center justify-center
            bg-gray-800 bg-opacity-50'>
              <div className='bg-white text-gray-700 p-4 rounded relative w-full
              max-w-80'>
                <h2 className='text-lg font-semibold mb-4'>Add Lecture</h2>

                <div className='mb-2'>
                  <p>Lecture Title</p>
                  <input 
                    type="text"
                    className='mt-1 block w-full border rounded py-1 px-2'
                    value={lectureDetails.lectureTitle}
                    onChange={(e) => setLectureDetails({ ...lectureDetails,
                    lectureTitle: e.target.value})} 
                  />
                </div>

                <div className='mb-2'>
                  <p>Duration (minutes)</p>
                  <input 
                    type="number"
                    className='mt-1 block w-full border rounded py-1 px-2'
                    value={lectureDetails.lectureDuration}
                    onChange={(e) => setLectureDetails({ ...lectureDetails,
                    lectureDuration: e.target.value})} 
                  />
                </div>

                <div className='mb-2'>
                  <p>Lecture URL</p>
                  <input 
                    type="text"
                    className='mt-1 block w-full border rounded py-1 px-2'
                    value={lectureDetails.lectureUrl}
                    onChange={(e) => setLectureDetails({ ...lectureDetails,
                    lectureUrl: e.target.value})} 
                  />
                </div>

                <div className='flex gap-2 my-4'>
                  <p>Is Preview Free?</p>
                  <input 
                    type="checkbox" className='mt-1 scale-125'
                    checked={lectureDetails.isPreviewFree}
                    onChange={(e)=> setLectureDetails({ ...lectureDetails,
                    isPreviewFree: e.target.checked })} 
                  />
                </div>

                <button type='button' className='w-full bg-blue-400 text-white px-4
                py-2 rounded' onClick={addLecture}>Add</button>

                <img onClick={()=> setShowPopup(false)} src={assets.cross_icon}
                className='absolute top-4 right-4 w-4 cursor-pointed' alt="" />

              </div>

            </div>
          )
          }
        </div>
        <div className='flex gap-4'>
          <button 
            type='submit' 
            disabled={isSubmitting}
            className={`${isSubmitting ? 'bg-gray-400' : 'bg-black'} text-white w-max py-2.5 px-8
            rounded my-4 transition-colors`}
          >
            {isSubmitting ? 'UPDATING...' : 'UPDATE'}
          </button>
          <button 
            type='button'
            onClick={() => navigate('/educator/my-courses')}
            className='bg-gray-500 text-white w-max py-2.5 px-8 rounded my-4 hover:bg-gray-600 transition-colors'
          >
            CANCEL
          </button>
        </div>
      </form>
      </div>

      {/* Preview Section */}
      <div className='hidden md:block w-1/2 sticky top-8 h-fit'>
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden'>
          <div className='bg-gradient-to-r from-blue-600 to-purple-600 p-4'>
            <h2 className='text-white text-xl font-bold'>Course Preview</h2>
            <p className='text-blue-100 text-sm'>See how your course will look</p>
          </div>
          
          <div className='p-6'>
            {/* Thumbnail Preview */}
            <div className='mb-6'>
              <div className='relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300'>
                {image ? (
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt="Course thumbnail" 
                    className='w-full h-full object-cover'
                  />
                ) : existingThumbnail ? (
                  <img 
                    src={existingThumbnail} 
                    alt="Course thumbnail" 
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                    <svg className='w-16 h-16 mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                    <p className='text-sm'>No thumbnail yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Course Title */}
            <div className='mb-4'>
              <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                {courseTitle || 'Course Title'}
              </h3>
              {discount > 0 && (
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-2xl font-bold text-green-600'>
                    ${(coursePrice - (coursePrice * discount / 100)).toFixed(2)}
                  </span>
                  <span className='text-lg text-gray-400 line-through'>
                    ${coursePrice}
                  </span>
                  <span className='bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold'>
                    {discount}% OFF
                  </span>
                </div>
              )}
              {!discount && coursePrice > 0 && (
                <span className='text-2xl font-bold text-gray-900'>
                  ${coursePrice}
                </span>
              )}
            </div>

            {/* Course Description */}
            <div className='mb-6'>
              <h4 className='text-sm font-semibold text-gray-700 mb-2'>Description</h4>
              <div 
                className='text-sm text-gray-600 prose prose-sm max-w-none'
                dangerouslySetInnerHTML={{ 
                  __html: quillRef.current?.root.innerHTML || '<p class="text-gray-400">No description yet</p>' 
                }}
              />
            </div>

            {/* Course Content */}
            <div>
              <h4 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                </svg>
                Course Content ({chapters.length} chapters, {chapters.reduce((sum, ch) => sum + ch.chapterContent.length, 0)} lectures)
              </h4>
              
              {chapters.length === 0 ? (
                <div className='text-center py-8 bg-gray-50 rounded-lg border border-gray-200'>
                  <svg className='w-12 h-12 text-gray-300 mx-auto mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                  </svg>
                  <p className='text-gray-400 text-sm'>No chapters added yet</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {chapters.map((chapter, index) => (
                    <div key={chapter.chapterId} className='border border-gray-200 rounded-lg overflow-hidden bg-gray-50'>
                      <div className='p-3 bg-white border-b border-gray-200'>
                        <div className='flex items-center gap-2'>
                          <span className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold'>
                            {index + 1}
                          </span>
                          <span className='font-semibold text-gray-900 text-sm'>{chapter.chapterTitle}</span>
                          <span className='ml-auto text-xs text-gray-500'>
                            {chapter.chapterContent.length} lectures
                          </span>
                        </div>
                      </div>
                      {chapter.chapterContent.length > 0 && (
                        <div className='p-2 space-y-1'>
                          {chapter.chapterContent.map((lecture, lectureIndex) => (
                            <div key={lecture.lectureId} className='flex items-center gap-2 text-xs text-gray-600 p-2 hover:bg-white rounded transition-colors'>
                              <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' />
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                              <span className='flex-1'>{lecture.lectureTitle}</span>
                              <span className='text-gray-400'>{lecture.lectureDuration} min</span>
                              {lecture.isPreviewFree && (
                                <span className='bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium'>
                                  Free
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default EditCourse
