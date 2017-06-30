using System;
using System.Data.Entity;
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

        public IQueryable<C_task> GetTask()
        {
            return db.C_task;
        }

        [ResponseType(typeof(C_task))]
        public async Task<IHttpActionResult> GetTask(Guid id)
        {
            C_task Task = await db.C_task.FindAsync(id);
            if (Task == null)
            {
                return NotFound();
            }

            return Ok(Task);
        }

        [ResponseType(typeof(void))]
        public async Task<IHttpActionResult> PutTask(Guid id, C_task Task)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != Task.ID)
            {
                return BadRequest();
            }

            db.Entry(Task).State = EntityState.Modified;

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
        public async Task<IHttpActionResult> PostTask(C_task Task)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

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

        [ResponseType(typeof(C_task))]
        public async Task<IHttpActionResult> DeleteTask(Guid id)
        {
            C_task Task = await db.C_task.FindAsync(id);
            if (Task == null)
            {
                return NotFound();
            }

            db.C_task.Remove(Task);
            await db.SaveChangesAsync();

            return Ok(Task);
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