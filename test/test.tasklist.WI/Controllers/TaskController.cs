using System;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using test.tasklist.data;

namespace test.tasklist.WI.Controllers
{
    public class TaskController : ApiController
    {
        private Repository db = new Repository();
        [HttpGet]
        public IQueryable<C_task> GetTask()
        {            
            return db.C_task.OrderBy(a=>a.Created);
        }

        [ResponseType(typeof(void))]
        public async Task<IHttpActionResult> PutTask(Guid id)
        {
            var Task = db.C_task.First(a => a.ID == id);
            Task.Finished = DateTime.Now;
            Task.IsCompleted = true;
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TaskExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return StatusCode(HttpStatusCode.NoContent);
        }

        [ResponseType(typeof(C_task))]
        [HttpPost]
        public async Task<IHttpActionResult> PostTask(C_task Task)
        {
            Task.Created = DateTime.Now;
            if (Task.Description == null) Task.Description = "";
            db.C_task.Add(Task);
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (TaskExists(Task.ID))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtRoute("DefaultApi", new { id = Task.ID }, Task);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool TaskExists(Guid id)
        {
            return db.C_task.Any(a => a.ID == id);
        }
    }
}