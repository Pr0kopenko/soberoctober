"""Upload generated pages using explicit FTPS; never delete remote content."""
import ftplib
import os
from pathlib import Path, PurePosixPath
import ssl
import sys


def deploy():
    keys = ('REG_FTP_HOST', 'REG_FTP_USER', 'REG_FTP_PASSWORD', 'REG_FTP_ROOT')
    if any(not os.environ.get(key) for key in keys):
        raise RuntimeError('Configure all four REG_FTP secrets before deployment')
    root = os.environ['REG_FTP_ROOT']
    if root in ('', '/', '.') or '..' in PurePosixPath(root).parts:
        raise RuntimeError('REG_FTP_ROOT must be the dedicated website directory')
    source = Path('dist')
    if not (source / 'index.html').is_file():
        raise RuntimeError('Build output is missing')
    files = [p for p in source.rglob('*') if p.is_file() and p.name != 'CNAME']
    if any(p.is_symlink() for p in source.rglob('*')):
        raise RuntimeError('Build output must not contain symlinks')
    # Assets and inner pages first; publish the homepage last.
    files.sort(key=lambda p: (p.relative_to(source).as_posix() == 'index.html', p.as_posix()))
    ftp = ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=60)
    try:
        ftp.connect(os.environ['REG_FTP_HOST'], 21)
        ftp.login(os.environ['REG_FTP_USER'], os.environ['REG_FTP_PASSWORD'])
        ftp.prot_p()
        ftp.cwd(root)  # Root must already exist; never silently upload elsewhere.
        base = ftp.pwd()
        created = set()
        for path in files:
            relative = path.relative_to(source)
            ftp.cwd(base)
            for part in relative.parts[:-1]:
                directory = ftp.pwd() + '/' + part
                if directory not in created:
                    try:
                        ftp.cwd(part)
                    except ftplib.error_perm:
                        ftp.mkd(part)
                        ftp.cwd(part)
                    created.add(directory)
                else:
                    ftp.cwd(part)
            temporary = relative.name + '.deploy-tmp'
            with path.open('rb') as stream:
                ftp.storbinary('STOR ' + temporary, stream)
            ftp.rename(temporary, relative.name)
        ftp.quit()
        print(f'Published {len(files)} files. Existing unrelated files were retained.')
    finally:
        ftp.close()


if __name__ == '__main__':
    try:
        deploy()
    except Exception:
        # Server responses may include account data; never put them in public logs.
        print('Deployment failed. Check FTPS support, credentials, root directory and permissions.', file=sys.stderr)
        sys.exit(1)
