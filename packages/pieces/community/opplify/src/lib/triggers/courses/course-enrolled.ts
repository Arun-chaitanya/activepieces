import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const courseEnrolled = createOpplifyTrigger({
  name: 'course_enrolled',
  displayName: 'Course Enrollment Created',
  description:
    'Triggers when a lead is enrolled in a course: at checkout (a course or a bundle), by a teammate (one or many) or by the courses agent. A lead already enrolled in the course does not trigger it again. Payload data carries courseId, courseTitle, enrollmentId, orderId and source. To react to one course, add a rule on courseId in the Filters panel.',
  eventType: 'course_enrolled',
  sampleData: SAMPLE_DATA.course_enrolled,
});
